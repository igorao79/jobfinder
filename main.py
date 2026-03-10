#!/usr/bin/env python3
"""
JobFinder Bot — ищет вакансии на hh.ru и отправляет в Telegram канал.
Запускается через GitHub Actions каждые 5 минут.
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
HH_USER_AGENT = "JobFinderBot/1.0 (igorao79@github.com)"
SEEN_IDS_FILE = "seen_ids.json"

# Ключевые слова (ищет в названии И описании вакансии)
KEYWORDS = [
    "vibe-coder",
    "vibe coder",
    "AI developer",
    "AI Vibe-coder",
    "вайб кодер",
    "Cursor",
    "Claude Code",
]

# OR-запрос для hh.ru
SEARCH_QUERY = " OR ".join(f'"{kw}"' for kw in KEYWORDS)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# ========== Дедупликация через файл ==========

def load_seen_ids():
    """Загрузить виденные ID из файла. Удаляет записи старше 7 дней."""
    try:
        with open(SEEN_IDS_FILE, "r") as f:
            data = json.load(f)
        cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        return {k: v for k, v in data.items() if v > cutoff}
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_seen_ids(seen_ids):
    """Сохранить виденные ID в файл."""
    with open(SEEN_IDS_FILE, "w") as f:
        json.dump(seen_ids, f)


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
        for region in resp.json().get("areas", []):
            if "тульская" in region.get("name", "").lower():
                for city in region.get("areas", []):
                    if city.get("name", "").lower() == "тула":
                        return city["id"]
                return region["id"]
    except Exception as e:
        logger.error(f"Error finding Tula area ID: {e}")
    return None


def search_vacancies(text, schedule=None, area=None):
    """Поиск вакансий через hh.ru API (без авторизации)."""
    params = {
        "text": text,
        "per_page": 100,
        "page": 0,
        "order_by": "publication_time",
        "period": 1,
    }
    if schedule:
        params["schedule"] = schedule
    if area:
        params["area"] = area

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
    """Проверяет наличие ключевых слов в тексте."""
    if not text:
        return False
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in KEYWORDS)


def strip_html(text):
    if not text:
        return ""
    return re.sub(r"<[^>]+>", " ", text).strip()


def format_salary(salary):
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


# ========== Main ==========

def main():
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set!")
        sys.exit(1)

    logger.info("=== Starting vacancy check ===")

    seen_ids = load_seen_ids()
    logger.info(f"Loaded {len(seen_ids)} seen vacancy IDs")

    tula_id = find_tula_area_id()
    logger.info(f"Tula area ID: {tula_id}")

    # Собираем кандидатов
    candidates = {}

    # 1) Удалённая работа — любой город
    logger.info("Searching remote vacancies...")
    for v in search_vacancies(SEARCH_QUERY, schedule="remote"):
        candidates[v["id"]] = v
    logger.info(f"Remote: {len(candidates)}")

    time.sleep(0.5)

    # 2) Тула — любой график
    if tula_id:
        logger.info("Searching Tula vacancies...")
        before = len(candidates)
        for v in search_vacancies(SEARCH_QUERY, area=tula_id):
            candidates[v["id"]] = v
        logger.info(f"Tula: +{len(candidates) - before}")

    # Только новые
    new_vacancies = {vid: v for vid, v in candidates.items() if vid not in seen_ids}
    logger.info(f"Total: {len(candidates)}, new: {len(new_vacancies)}")

    sent_count = 0
    now = datetime.now(timezone.utc).isoformat()

    for vid, vacancy in new_vacancies.items():
        details = get_vacancy_details(vid)
        time.sleep(0.3)

        name = vacancy.get("name", "")
        description = strip_html(details.get("description", "")) if details else ""

        if not keyword_matches(name) and not keyword_matches(description):
            logger.info(f"Skip {vid} — no keyword match")
            seen_ids[vid] = now
            continue

        msg = format_vacancy_message(vacancy, details)
        result = send_telegram_message(msg)

        if result and result.get("ok"):
            sent_count += 1
            logger.info(f"Sent: {name}")

        seen_ids[vid] = now
        time.sleep(0.5)

    save_seen_ids(seen_ids)
    logger.info(f"=== Done! Sent {sent_count} vacancies ===")


if __name__ == "__main__":
    main()
