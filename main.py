#!/usr/bin/env python3
"""
JobFinder Bot - ищет вакансии на hh.ru по ключевым словам и отправляет в Telegram.
Запускается как Render Cron Job каждые 5 минут.
"""

import os
import sys
import json
import time
import html
import re
import logging
from datetime import datetime, timedelta, timezone

import requests

# --- Конфигурация ---
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "")
HH_USER_AGENT = "JobFinderBot/1.0 (igorao79@github.com)"

# Ключевые слова для поиска (ищет в названии И описании вакансии)
KEYWORDS = [
    "vibe-coder",
    "vibe coder",
    "AI developer",
    "AI Vibe-coder",
    "вайб кодер",
    "Cursor",
    "Claude Code",
]

# OR-запрос для hh.ru API
SEARCH_QUERY = " OR ".join(f'"{kw}"' for kw in KEYWORDS)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# ========== База данных (PostgreSQL) для дедупликации ==========

def get_db_connection():
    """Подключение к PostgreSQL (Render free DB)."""
    if not DATABASE_URL:
        return None
    try:
        import psycopg2
        return psycopg2.connect(DATABASE_URL)
    except Exception as e:
        logger.warning(f"Cannot connect to DB: {e}")
        return None


def init_db():
    """Создаёт таблицу seen_vacancies если её нет."""
    conn = get_db_connection()
    if not conn:
        return
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS seen_vacancies (
                vacancy_id VARCHAR(20) PRIMARY KEY,
                seen_at TIMESTAMP DEFAULT NOW()
            )
        """)
        conn.commit()
        # Чистим записи старше 7 дней
        cur.execute("DELETE FROM seen_vacancies WHERE seen_at < NOW() - INTERVAL '7 days'")
        conn.commit()
        cur.close()
        conn.close()
        logger.info("Database initialized")
    except Exception as e:
        logger.error(f"DB init error: {e}")


def db_get_seen_ids():
    """Получить все виденные ID вакансий из БД."""
    conn = get_db_connection()
    if not conn:
        return set()
    try:
        cur = conn.cursor()
        cur.execute("SELECT vacancy_id FROM seen_vacancies")
        ids = {row[0] for row in cur.fetchall()}
        cur.close()
        conn.close()
        return ids
    except Exception as e:
        logger.error(f"DB read error: {e}")
        return set()


def db_mark_seen(vacancy_ids):
    """Пометить вакансии как виденные в БД."""
    if not vacancy_ids:
        return
    conn = get_db_connection()
    if not conn:
        return
    try:
        cur = conn.cursor()
        for vid in vacancy_ids:
            cur.execute(
                "INSERT INTO seen_vacancies (vacancy_id) VALUES (%s) ON CONFLICT DO NOTHING",
                (vid,),
            )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"DB write error: {e}")


# ========== hh.ru API ==========

def find_tula_area_id():
    """Находит ID города Тула через hh.ru Areas API."""
    try:
        resp = requests.get(
            "https://api.hh.ru/areas/113",
            headers={"HH-User-Agent": HH_USER_AGENT},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        for region in data.get("areas", []):
            if "тульская" in region.get("name", "").lower():
                for city in region.get("areas", []):
                    if city.get("name", "").lower() == "тула":
                        return city["id"]
                return region["id"]
    except Exception as e:
        logger.error(f"Error finding Tula area ID: {e}")
    return None


def search_vacancies(text, schedule=None, area=None, date_from=None):
    """Поиск вакансий через hh.ru API (без авторизации)."""
    params = {
        "text": text,
        "per_page": 100,
        "page": 0,
        "order_by": "publication_time",
        "period": 1,  # последний 1 день
    }

    if schedule:
        params["schedule"] = schedule
    if area:
        params["area"] = area
    if date_from:
        params["date_from"] = date_from

    headers = {"HH-User-Agent": HH_USER_AGENT}
    all_items = []

    try:
        resp = requests.get(
            "https://api.hh.ru/vacancies",
            params=params,
            headers=headers,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        all_items.extend(data.get("items", []))

        # Загружаем дополнительные страницы (макс. 5)
        total_pages = min(data.get("pages", 1), 5)
        for page in range(1, total_pages):
            time.sleep(0.3)
            params["page"] = page
            resp = requests.get(
                "https://api.hh.ru/vacancies",
                params=params,
                headers=headers,
                timeout=15,
            )
            resp.raise_for_status()
            all_items.extend(resp.json().get("items", []))

    except Exception as e:
        logger.error(f"Error searching vacancies: {e}")

    return all_items


def get_vacancy_details(vacancy_id):
    """Получить полное описание вакансии."""
    try:
        resp = requests.get(
            f"https://api.hh.ru/vacancies/{vacancy_id}",
            headers={"HH-User-Agent": HH_USER_AGENT},
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error(f"Error getting vacancy {vacancy_id}: {e}")
    return None


# ========== Утилиты ==========

def keyword_matches(text):
    """Проверяет наличие ключевых слов в тексте (case-insensitive)."""
    if not text:
        return False
    text_lower = text.lower()
    for kw in KEYWORDS:
        if kw.lower() in text_lower:
            return True
    return False


def strip_html(text):
    """Убирает HTML-теги из текста."""
    if not text:
        return ""
    return re.sub(r"<[^>]+>", " ", text).strip()


def format_salary(salary):
    """Форматирует зарплату."""
    if not salary:
        return "Не указана"
    parts = []
    if salary.get("from"):
        parts.append(f"от {salary['from']:,}".replace(",", " "))
    if salary.get("to"):
        parts.append(f"до {salary['to']:,}".replace(",", " "))
    if not parts:
        return "Не указана"
    currency = salary.get("currency", "RUR")
    gross = " (до вычета)" if salary.get("gross") else " (на руки)"
    return " ".join(parts) + f" {currency}{gross}"


def format_vacancy_message(vacancy, details=None):
    """Форматирует вакансию для отправки в Telegram."""
    name = html.escape(vacancy.get("name", "Без названия"))
    employer = html.escape(vacancy.get("employer", {}).get("name", "Неизвестно"))
    area = html.escape(vacancy.get("area", {}).get("name", ""))
    url = vacancy.get("alternate_url", "")
    salary_text = format_salary(vacancy.get("salary"))

    schedule_text = ""
    if details and details.get("schedule"):
        schedule_text = details["schedule"].get("name", "")

    experience_text = ""
    if details and details.get("experience"):
        experience_text = details["experience"].get("name", "")

    lines = [
        f"<b>{name}</b>",
        f"\U0001F3E2 {employer}",
        f"\U0001F4CD {area}",
        f"\U0001F4B0 {salary_text}",
    ]

    if schedule_text:
        lines.append(f"\U0001F4CB {html.escape(schedule_text)}")
    if experience_text:
        lines.append(f"\U0001F4CA {html.escape(experience_text)}")

    lines.append(f'\n<a href="{url}">Открыть вакансию</a>')

    return "\n".join(lines)


# ========== Telegram ==========

def send_telegram_message(text):
    """Отправляет сообщение в Telegram канал."""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }

    try:
        resp = requests.post(url, json=data, timeout=10)
        result = resp.json()
        if not result.get("ok"):
            logger.error(f"Telegram error: {result}")
        return result
    except Exception as e:
        logger.error(f"Error sending Telegram message: {e}")
        return None


# ========== Главная логика ==========

def main():
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set!")
        sys.exit(1)

    logger.info("=== Starting vacancy check ===")
    logger.info(f"Search query: {SEARCH_QUERY}")

    # Инициализация БД (если подключена)
    use_db = bool(DATABASE_URL)
    if use_db:
        init_db()
        seen_ids = db_get_seen_ids()
        logger.info(f"Using PostgreSQL for dedup. Seen IDs: {len(seen_ids)}")
    else:
        seen_ids = set()
        logger.info("No DATABASE_URL — using date_from filter (last 10 min)")

    # Находим ID Тулы
    tula_id = find_tula_area_id()
    logger.info(f"Tula area ID: {tula_id}")

    # date_from для режима без БД (последние 10 минут)
    date_from = None
    if not use_db:
        date_from = (
            datetime.now(timezone.utc) - timedelta(minutes=10)
        ).strftime("%Y-%m-%dT%H:%M:%S+0000")

    # Собираем все вакансии-кандидаты
    candidates = {}

    # 1. Удалённая работа — любой город
    logger.info("Searching remote vacancies...")
    remote_results = search_vacancies(
        SEARCH_QUERY, schedule="remote", date_from=date_from
    )
    for v in remote_results:
        candidates[v["id"]] = v
    logger.info(f"Remote vacancies found: {len(remote_results)}")

    time.sleep(0.5)

    # 2. Тула — любой график
    if tula_id:
        logger.info(f"Searching Tula vacancies (area={tula_id})...")
        tula_results = search_vacancies(
            SEARCH_QUERY, area=tula_id, date_from=date_from
        )
        for v in tula_results:
            candidates[v["id"]] = v
        logger.info(f"Tula vacancies found: {len(tula_results)}")

    # Фильтруем уже виденные
    new_vacancies = {
        vid: v for vid, v in candidates.items() if vid not in seen_ids
    }
    logger.info(
        f"Total candidates: {len(candidates)}, new: {len(new_vacancies)}"
    )

    # Проверяем ключевые слова в описании и отправляем
    sent_count = 0
    new_seen = []

    for vid, vacancy in new_vacancies.items():
        # Получаем полные данные вакансии (с описанием)
        details = get_vacancy_details(vid)
        time.sleep(0.3)

        name = vacancy.get("name", "")
        description = strip_html(details.get("description", "")) if details else ""

        # Проверяем ключевые слова в названии ИЛИ описании
        if not keyword_matches(name) and not keyword_matches(description):
            logger.info(f"Skip {vid} — keywords not in name/description")
            new_seen.append(vid)
            continue

        # Форматируем и отправляем
        msg = format_vacancy_message(vacancy, details)
        result = send_telegram_message(msg)

        if result and result.get("ok"):
            sent_count += 1
            logger.info(f"Sent: {name}")
        else:
            logger.warning(f"Failed to send: {name}")

        new_seen.append(vid)
        time.sleep(0.5)

    # Сохраняем виденные ID
    if use_db and new_seen:
        db_mark_seen(new_seen)

    logger.info(f"=== Done! Sent {sent_count} new vacancies ===")


if __name__ == "__main__":
    main()
