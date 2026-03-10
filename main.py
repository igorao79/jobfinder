#!/usr/bin/env python3
"""
JobFinder Bot — ищет вакансии на hh.ru и отправляет в Telegram канал.
Запускается через GitHub Actions каждые 5 минут.

Дедупликация:
  - по ID вакансии (кэш 7 дней)
  - по контенту: employer_id + название (ловит перезаливы одной и той же вакансии)
  - отправляются только вакансии, опубликованные ПОСЛЕ первого запуска бота
"""

import os
import sys
import json
import time
import html
import hashlib
import re
import logging
from datetime import datetime, timedelta, timezone

import requests

# --- Конфигурация ---
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")
HH_USER_AGENT = "JobFinderBot/1.0 (igorao79@github.com)"
CACHE_FILE = "seen_ids.json"
CACHE_TTL_DAYS = 7

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


# ========== Кэш (дедупликация) ==========

def load_cache():
    """
    Загрузить кэш. Формат:
    {
        "init_time": "ISO-timestamp первого запуска",
        "seen_ids":          {"vacancy_id": "ISO-timestamp", ...},
        "seen_fingerprints": {"hash": "ISO-timestamp", ...}
    }
    """
    try:
        with open(CACHE_FILE, "r") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = {}

    # Гарантируем структуру
    data.setdefault("init_time", "")
    data.setdefault("vacancy_counter", 0)
    data.setdefault("seen_ids", {})
    data.setdefault("seen_fingerprints", {})

    # Чистим записи старше 7 дней
    cutoff = (datetime.now(timezone.utc) - timedelta(days=CACHE_TTL_DAYS)).isoformat()
    data["seen_ids"] = {k: v for k, v in data["seen_ids"].items() if v > cutoff}
    data["seen_fingerprints"] = {
        k: v for k, v in data["seen_fingerprints"].items() if v > cutoff
    }

    return data


def save_cache(data):
    with open(CACHE_FILE, "w") as f:
        json.dump(data, f, ensure_ascii=False)


def vacancy_fingerprint(vacancy):
    """
    Хэш: employer_id + нормализованное название.
    Ловит перезаливы одной и той же вакансии с новым ID.
    """
    employer_id = str(vacancy.get("employer", {}).get("id", ""))
    name = vacancy.get("name", "").lower().strip()
    raw = f"{employer_id}::{name}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


# ========== hh.ru API ==========

def find_tula_area_id():
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
    if not text:
        return False
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in KEYWORDS)


def find_matched_keywords(name, description):
    """Возвращает список найденных ключевых слов в названии и описании."""
    combined = (name + " " + description).lower()
    found = []
    for kw in KEYWORDS:
        if kw.lower() in combined and kw not in found:
            found.append(kw)
    return found


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


def format_vacancy_message(vacancy, details=None, number=0, matched_keywords=None):
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

    # Найденные ключевые слова
    kw_text = ""
    if matched_keywords:
        kw_text = ", ".join(matched_keywords)

    lines = [
        f"\U0001F4E2 <b>Вакансия №{number}</b>",
        "",
        f"\U0001F50E <b>{name}</b>",
        f"\U0001F3E2 {employer}",
        "",
        f"\U0001F4CD {area}",
        f"\U0001F4B0 {salary_text}",
    ]
    if schedule_text:
        lines.append(f"\U0001F4CB {html.escape(schedule_text)}")
    if experience_text:
        lines.append(f"\U0001F4CA {html.escape(experience_text)}")

    lines.append("")
    if kw_text:
        lines.append(f"\U0001F3AF Совпадение: <i>{html.escape(kw_text)}</i>")
        lines.append("")

    lines.append(f'<a href="{url}">\U0001F517 Открыть вакансию</a>')

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

    cache = load_cache()
    init_time = cache["init_time"]
    vacancy_counter = cache["vacancy_counter"]
    seen_ids = cache["seen_ids"]
    seen_fps = cache["seen_fingerprints"]

    # --- Первый запуск: запоминаем время, ничего не отправляем ---
    if not init_time:
        init_time = datetime.now(timezone.utc).isoformat()
        cache["init_time"] = init_time
        save_cache(cache)
        logger.info(f"First run — init_time set to {init_time}. No vacancies will be sent this run.")
        return

    logger.info(f"init_time: {init_time}")
    logger.info(f"Cache: {len(seen_ids)} IDs, {len(seen_fps)} fingerprints")

    tula_id = find_tula_area_id()
    logger.info(f"Tula area ID: {tula_id}")

    # --- Собираем кандидатов ---
    candidates = {}

    logger.info("Searching remote vacancies...")
    for v in search_vacancies(SEARCH_QUERY, schedule="remote"):
        candidates[v["id"]] = v
    logger.info(f"Remote: {len(candidates)}")

    time.sleep(0.5)

    if tula_id:
        logger.info("Searching Tula vacancies...")
        before = len(candidates)
        for v in search_vacancies(SEARCH_QUERY, area=tula_id):
            candidates[v["id"]] = v
        logger.info(f"Tula: +{len(candidates) - before}")

    # --- Фильтрация ---
    now = datetime.now(timezone.utc).isoformat()
    sent_count = 0
    skipped_old = 0
    skipped_seen = 0
    skipped_fp = 0
    skipped_kw = 0

    for vid, vacancy in candidates.items():
        # 1) Уже видели этот ID
        if vid in seen_ids:
            skipped_seen += 1
            continue

        # 2) Вакансия опубликована ДО инициализации бота — пропускаем
        published_at = vacancy.get("published_at", "")
        if published_at and published_at < init_time:
            skipped_old += 1
            seen_ids[vid] = now
            continue

        # 3) Контентный fingerprint (employer + название) — ловим перезаливы
        fp = vacancy_fingerprint(vacancy)
        if fp in seen_fps:
            skipped_fp += 1
            seen_ids[vid] = now
            continue

        # 4) Проверяем ключевые слова в описании
        details = get_vacancy_details(vid)
        time.sleep(0.3)

        name = vacancy.get("name", "")
        description = strip_html(details.get("description", "")) if details else ""

        # Ищем совпавшие ключевые слова
        matched = find_matched_keywords(name, description)

        if not matched:
            skipped_kw += 1
            seen_ids[vid] = now
            seen_fps[fp] = now
            continue

        # 5) Отправляем
        vacancy_counter += 1
        msg = format_vacancy_message(
            vacancy, details,
            number=vacancy_counter,
            matched_keywords=matched,
        )
        result = send_telegram_message(msg)

        if result and result.get("ok"):
            sent_count += 1
            logger.info(f"Sent #{vacancy_counter}: {name}")

        seen_ids[vid] = now
        seen_fps[fp] = now
        time.sleep(0.5)

    # --- Сохраняем кэш ---
    cache["vacancy_counter"] = vacancy_counter
    cache["seen_ids"] = seen_ids
    cache["seen_fingerprints"] = seen_fps
    save_cache(cache)

    logger.info(
        f"=== Done! Sent: {sent_count} | "
        f"Skipped — seen: {skipped_seen}, old: {skipped_old}, "
        f"repost: {skipped_fp}, no keywords: {skipped_kw} ==="
    )


if __name__ == "__main__":
    main()
