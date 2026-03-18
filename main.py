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
import random
import logging
from datetime import datetime, timedelta, timezone

import requests

from auto_apply import is_auto_apply_available, apply_to_vacancy, close_browser_session, COVER_LETTER_FRONTEND, COVER_LETTER_LAYOUT

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

# Стоп-слова в названии вакансии (senior, lead, нерелевантные роли)
TITLE_BLACKLIST = [
    # Грейд
    "senior", "сеньор", "сениор", "ведущий",
    "team lead", "тимлид", "тим лид", "teamlead",
    "lead", "лид", "principal", "staff",
    "head of", "director", "директор",
    "архитектор", "architect",
    # Нерелевантные роли (не разработка)
    "analyst", "аналитик",
    "менеджер", "manager",
    "руководитель",
    "product owner",
    "проджект", "project manager",
    "трафик", "traffic",
    "маркетолог", "marketing",
    "дизайнер", "designer",
    "рекрутер", "recruiter", "hr",
    "sales", "продажи",
    "копирайтер", "copywriter",
    "контент", "content manager",
    "seo", "smm",
    # Мобильная разработка
    "ios", "android", "мобильн", "mobile",
    "flutter", "react native", "swift", "kotlin",
    "business owner",
    "data scientist",
    "data analyst",
    "product analyst",
    # Мобильная разработка
    "ios", "android", "мобильн", "mobile",
    "flutter", "react native", "kotlin", "swift",
]

# Работодатели в чёрном списке
EMPLOYER_BLACKLIST = [
    "mstech l.l.c-fz",
    "mstech",
]

# OR-запрос для hh.ru (AI-вакансии)
SEARCH_QUERY = " OR ".join(f'"{kw}"' for kw in KEYWORDS)

# Второй поиск — фронтенд-вакансии (junior/middle, без AI-фильтров)
FRONTEND_KEYWORDS = [
    "frontend developer",
    "frontend разработчик",
    "фронтенд разработчик",
    "front-end developer",
    "front-end разработчик",
    "junior frontend",
    "middle frontend",
    "react developer",
    "react разработчик",
    "junior react",
    "middle react",
    "next.js developer",
    "nextjs developer",
]

FRONTEND_SEARCH_QUERY = " OR ".join(f'"{kw}"' for kw in FRONTEND_KEYWORDS)

# Стоп-слова ТОЛЬКО для фронтенд-поиска (дополнительно к TITLE_BLACKLIST)
FRONTEND_TITLE_BLACKLIST = [
    "backend", "бэкенд", "бекенд",
    "devops", "qa", "тестировщик",
    "data engineer", "ml engineer",
    "gamedev", "game developer",
]

# Третий поиск — верстальщики (HTML/CSS, но именно разработка, не дизайн)
LAYOUT_KEYWORDS = [
    "верстальщик",
    "html верстальщик",
    "html css верстальщик",
    "html developer",
    "верстка сайтов",
    "junior верстальщик",
    "middle верстальщик",
]

LAYOUT_SEARCH_QUERY = " OR ".join(f'"{kw}"' for kw in LAYOUT_KEYWORDS)

# Стоп-слова для верстальщиков — отсекаем дизайнеров и нерелевантное
LAYOUT_TITLE_BLACKLIST = [
    "дизайн", "design",
    "figma", "photoshop", "illustrator",
    "ui/ux", "ux/ui", "ui ux", "ux ui",
    "графич", "graphic",
    "полиграф",
    "email", "письм",
]

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
    data.setdefault("daily_stats", {"date": "", "sent_today": 0})

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


def is_blacklisted_title(title):
    """Проверяет, содержит ли название вакансии стоп-слова (senior, lead, нерелевантные роли)."""
    if not title:
        return False
    title_lower = title.lower()
    return any(word in title_lower for word in TITLE_BLACKLIST)


def is_blacklisted_employer(vacancy):
    """Проверяет, находится ли работодатель в чёрном списке."""
    employer_name = vacancy.get("employer", {}).get("name", "").lower().strip()
    return any(bl in employer_name for bl in EMPLOYER_BLACKLIST)


def find_matched_keywords(name, description):
    """Возвращает список найденных ключевых слов в названии и описании."""
    combined = (name + " " + description).lower()
    found = []
    for kw in KEYWORDS:
        if kw.lower() in combined and kw not in found:
            found.append(kw)
    return found


# Паттерны "ловушек" в описаниях вакансий — вакансии с особыми требованиями к отклику
# Если описание содержит такие фразы, автоотклик будет ПРОПУЩЕН (вакансия всё равно отправится в Telegram)
DESCRIPTION_TRAP_PATTERNS = [
    # Тестовые задания в описании
    "тестовое задание",
    "тестовое (step",
    "step 0",
    "step 1",
    "пройти тест",
    "выполни задание",
    "выполните задание",
    "пройди тест",
    "пройдите тест",
    # AI-фильтры
    "ai-фильтр",
    "ai фильтр",
    "пройти через наш фильтр",
    "проверка начинается прямо сейчас",
    # Требования к сопроводительному письму
    "при отклике укажи",
    "при отклике укажите",
    "при отклике напиши",
    "при отклике напишите",
    "в сопроводительном укажи",
    "в сопроводительном укажите",
    "в сопроводительном напиши",
    "в сопроводительном напишите",
    "в сопроводительном письме укажи",
    "в сопроводительном письме укажите",
    "в сопроводительном письме напиши",
    "в сопроводительном письме напишите",
    "в отклике укажи",
    "в отклике укажите",
    "в отклике напиши",
    "в отклике напишите",
    "напиши в отклике",
    "напишите в отклике",
    "пришли короткое сопроводительное",
    "пришлите короткое сопроводительное",
    # Кодовые слова / пароли
    "кодовое слово",
    "напиши слово",
    "напишите слово",
    "укажи слово",
    "укажите слово",
    "пароль для отклика",
    # Специальные формы отклика
    "заполни форму",
    "заполните форму",
    "заполни анкету",
    "заполните анкету",
    "откликайся через форму",
    "откликайтесь через форму",
    "отправь резюме на почту",
    "отправьте резюме на почту",
    "пришли резюме на",
    "пришлите резюме на",
]


def detect_description_traps(description):
    """
    Анализирует описание вакансии на наличие "ловушек":
    - тестовые задания в описании
    - AI-фильтры
    - специальные требования к сопроводительному письму
    - кодовые слова

    Возвращает список найденных ловушек (пустой = безопасно для автоотклика).
    """
    if not description:
        return []

    desc_lower = description.lower()
    found_traps = []

    for pattern in DESCRIPTION_TRAP_PATTERNS:
        if pattern in desc_lower:
            found_traps.append(pattern)

    return found_traps


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


def format_vacancy_message(vacancy, details=None, number=0, matched_keywords=None, apply_status=None, traps=None):
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

    # Предупреждение о ловушках
    if traps:
        lines.append("")
        lines.append("\u26a0\ufe0f <b>Особые условия отклика:</b>")
        # Показываем до 3 найденных паттернов
        for trap in traps[:3]:
            lines.append(f"  \u2022 <i>{html.escape(trap)}</i>")
        if len(traps) > 3:
            lines.append(f"  \u2022 ...и ещё {len(traps) - 3}")

    # Статус автоотклика
    if apply_status == "applied":
        lines.append("")
        lines.append("\u2705 <b>Автоотклик отправлен</b>")
    elif apply_status == "already_applied":
        lines.append("")
        lines.append("\u2611\ufe0f Уже откликались ранее")
    elif apply_status == "skipped_trap":
        lines.append("")
        lines.append("\u270b Автоотклик пропущен (особые условия)")
    elif apply_status == "skipped_questions":
        lines.append("")
        lines.append("\u270b Автоотклик пропущен (доп. вопросы работодателя)")
    elif apply_status == "failed":
        lines.append("")
        lines.append("\u274c Автоотклик не удался")

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


def edit_telegram_message(message_id, text):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/editMessageText"
    data = {
        "chat_id": TELEGRAM_CHAT_ID,
        "message_id": message_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    try:
        resp = requests.post(url, json=data, timeout=10)
        result = resp.json()
        if not result.get("ok"):
            logger.error(f"Telegram edit error: {result}")
        return result
    except Exception as e:
        logger.error(f"Error editing Telegram message: {e}")
        return None


# ========== Дайджест ==========

def send_daily_digest(cache):
    """Отправляет ежедневную статистику в Telegram."""
    stats = cache["daily_stats"]
    total = cache["vacancy_counter"]
    init_time = cache.get("init_time", "")

    # Дата в формате ДД.ММ.ГГГГ
    today = datetime.now(timezone(timedelta(hours=3)))  # MSK
    date_str = today.strftime("%d.%m.%Y")

    sent_today = stats.get("sent_today", 0)

    # Дней с запуска
    days_running = ""
    if init_time:
        try:
            init_dt = datetime.fromisoformat(init_time)
            delta = today - init_dt
            days_running = f"\n\U0001F4C5 Дней работы: {delta.days}"
        except Exception:
            pass

    lines = [
        "\U0001F4CA <b>Статистика за день</b>",
        f"\U0001F4C6 {date_str}",
        "",
        f"\U0001F4EC Сегодня: <b>{sent_today}</b> вакансий",
        f"\U0001F4C8 Всего с запуска: <b>{total}</b> вакансий",
    ]
    if days_running:
        lines.append(days_running)

    msg = "\n".join(lines)
    send_telegram_message(msg)
    logger.info(f"Digest sent: today={sent_today}, total={total}")

    # Сбрасываем дневной счётчик
    cache["daily_stats"] = {"date": today.strftime("%Y-%m-%d"), "sent_today": 0}
    save_cache(cache)


# ========== Main ==========

def main():
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set!")
        sys.exit(1)

    # Режим дайджеста
    if "--digest" in sys.argv:
        logger.info("=== Sending daily digest ===")
        cache = load_cache()
        send_daily_digest(cache)
        return

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

    # --- Собираем кандидатов (AI-вакансии) ---
    candidates = {}

    logger.info("Searching remote AI vacancies...")
    for v in search_vacancies(SEARCH_QUERY, schedule="remote"):
        candidates[v["id"]] = {"vacancy": v, "type": "ai"}
    logger.info(f"Remote AI: {len(candidates)}")

    time.sleep(0.5)

    if tula_id:
        logger.info("Searching Tula AI vacancies...")
        before = len(candidates)
        for v in search_vacancies(SEARCH_QUERY, area=tula_id):
            candidates[v["id"]] = {"vacancy": v, "type": "ai"}
        logger.info(f"Tula AI: +{len(candidates) - before}")

    time.sleep(0.5)

    # --- Собираем кандидатов (Frontend-вакансии) ---
    logger.info("Searching remote Frontend vacancies...")
    before = len(candidates)
    for v in search_vacancies(FRONTEND_SEARCH_QUERY, schedule="remote"):
        if v["id"] not in candidates:  # не дублируем AI-вакансии
            candidates[v["id"]] = {"vacancy": v, "type": "frontend"}
    logger.info(f"Remote Frontend: +{len(candidates) - before}")

    time.sleep(0.5)

    if tula_id:
        logger.info("Searching Tula Frontend vacancies...")
        before2 = len(candidates)
        for v in search_vacancies(FRONTEND_SEARCH_QUERY, area=tula_id):
            if v["id"] not in candidates:
                candidates[v["id"]] = {"vacancy": v, "type": "frontend"}
        logger.info(f"Tula Frontend: +{len(candidates) - before2}")

    time.sleep(0.5)

    # --- Собираем кандидатов (Верстальщики) ---
    logger.info("Searching remote Layout vacancies...")
    before = len(candidates)
    for v in search_vacancies(LAYOUT_SEARCH_QUERY, schedule="remote"):
        if v["id"] not in candidates:
            candidates[v["id"]] = {"vacancy": v, "type": "layout"}
    logger.info(f"Remote Layout: +{len(candidates) - before}")

    time.sleep(0.5)

    if tula_id:
        logger.info("Searching Tula Layout vacancies...")
        before2 = len(candidates)
        for v in search_vacancies(LAYOUT_SEARCH_QUERY, area=tula_id):
            if v["id"] not in candidates:
                candidates[v["id"]] = {"vacancy": v, "type": "layout"}
        logger.info(f"Tula Layout: +{len(candidates) - before2}")

    # --- Дневная статистика ---
    today_msk = datetime.now(timezone(timedelta(hours=3))).strftime("%Y-%m-%d")
    stats = cache["daily_stats"]
    if stats.get("date") != today_msk:
        stats["date"] = today_msk
        stats["sent_today"] = 0

    # --- Автоотклик ---
    auto_apply = is_auto_apply_available()
    if auto_apply:
        logger.info("Auto-apply is ENABLED")
    else:
        logger.info("Auto-apply is disabled")

    # --- Фильтрация ---
    now = datetime.now(timezone.utc).isoformat()
    sent_count = 0
    applied_count = 0
    skipped_old = 0
    skipped_seen = 0
    skipped_fp = 0
    skipped_kw = 0
    skipped_grade = 0

    for vid, entry in candidates.items():
        vacancy = entry["vacancy"]
        vacancy_type = entry["type"]  # "ai" or "frontend"

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

        # 3) Фильтр по грейду и нерелевантным ролям
        name = vacancy.get("name", "")
        if is_blacklisted_title(name):
            skipped_grade += 1
            seen_ids[vid] = now
            logger.info(f"Skip {vid} — blacklisted title: {name}")
            continue

        # 3.5) Фильтр по работодателю
        if is_blacklisted_employer(vacancy):
            skipped_grade += 1
            seen_ids[vid] = now
            employer_name = vacancy.get("employer", {}).get("name", "")
            logger.info(f"Skip {vid} — blacklisted employer: {employer_name}")
            continue

        # 3.6) Доп. фильтр для frontend-вакансий
        if vacancy_type == "frontend":
            name_lower = name.lower()
            if any(word in name_lower for word in FRONTEND_TITLE_BLACKLIST):
                skipped_grade += 1
                seen_ids[vid] = now
                logger.info(f"Skip {vid} — frontend blacklist: {name}")
                continue

        # 3.7) Доп. фильтр для верстальщиков (отсекаем дизайнеров)
        if vacancy_type == "layout":
            name_lower = name.lower()
            if any(word in name_lower for word in LAYOUT_TITLE_BLACKLIST):
                skipped_grade += 1
                seen_ids[vid] = now
                logger.info(f"Skip {vid} — layout blacklist (designer): {name}")
                continue

        # 4) Контентный fingerprint (employer + название) — ловим перезаливы
        fp = vacancy_fingerprint(vacancy)
        if fp in seen_fps:
            skipped_fp += 1
            seen_ids[vid] = now
            continue

        # 5) Проверяем ключевые слова в описании
        details = get_vacancy_details(vid)
        time.sleep(0.3)

        description = strip_html(details.get("description", "")) if details else ""

        # Для AI-вакансий: ищем совпавшие AI-ключевые слова
        # Для frontend-вакансий: совпадение по названию (уже прошли поиск hh.ru)
        if vacancy_type == "ai":
            matched = find_matched_keywords(name, description)
            if not matched:
                skipped_kw += 1
                seen_ids[vid] = now
                seen_fps[fp] = now
                continue
        elif vacancy_type == "frontend":
            matched = [vacancy_type.upper()]
            for fkw in FRONTEND_KEYWORDS:
                if fkw.lower() in name.lower():
                    matched = [fkw]
                    break
        else:
            # Layout
            matched = ["Вёрстка"]
            for lkw in LAYOUT_KEYWORDS:
                if lkw.lower() in name.lower():
                    matched = [lkw]
                    break

        # 6) Проверяем описание на "ловушки" (тестовые задания, AI-фильтры и т.д.)
        traps = detect_description_traps(description)
        has_traps = len(traps) > 0

        if has_traps:
            logger.info(f"Traps detected in {vid}: {traps}")

        # 7) Отправляем в Telegram (сразу, без статуса отклика)
        vacancy_counter += 1
        msg = format_vacancy_message(
            vacancy, details,
            number=vacancy_counter,
            matched_keywords=matched,
            traps=traps,
        )
        result = send_telegram_message(msg)

        # 8) Автоотклик с задержкой 2-4 мин (имитация: человек читает вакансию в ТГ)
        apply_status = None
        if auto_apply:
            if has_traps:
                apply_status = "skipped_trap"
                logger.info(f"Auto-apply SKIPPED (traps): {name}")
            else:
                vacancy_url = vacancy.get("alternate_url", "")
                if vacancy_url:
                    delay = random.randint(120, 240)
                    logger.info(f"Auto-apply delay: {delay}s before applying to {name}")
                    time.sleep(delay)

                    # Выбираем cover letter по типу вакансии
                    cl = None  # default = AI cover letter
                    if vacancy_type == "frontend":
                        cl = COVER_LETTER_FRONTEND
                    elif vacancy_type == "layout":
                        cl = COVER_LETTER_LAYOUT
                    apply_status = apply_to_vacancy(vacancy_url, name, cover_letter=cl)
                    if apply_status == "applied":
                        applied_count += 1

        # 9) Обновляем сообщение в ТГ со статусом отклика
        if apply_status:
            msg_updated = format_vacancy_message(
                vacancy, details,
                number=vacancy_counter,
                matched_keywords=matched,
                apply_status=apply_status,
                traps=traps,
            )
            if result and result.get("ok"):
                message_id = result["result"]["message_id"]
                edit_telegram_message(message_id, msg_updated)

        if result and result.get("ok"):
            sent_count += 1
            stats["sent_today"] += 1
            logger.info(f"Sent #{vacancy_counter}: [{vacancy_type}] {name}")

        seen_ids[vid] = now
        seen_fps[fp] = now
        time.sleep(0.5)

    # --- Сохраняем кэш ---
    cache["vacancy_counter"] = vacancy_counter
    cache["daily_stats"] = stats
    cache["seen_ids"] = seen_ids
    cache["seen_fingerprints"] = seen_fps
    save_cache(cache)

    # --- Закрываем сессию браузера ---
    if auto_apply:
        close_browser_session()

    logger.info(
        f"=== Done! Sent: {sent_count}, Applied: {applied_count} | "
        f"Skipped — seen: {skipped_seen}, old: {skipped_old}, "
        f"grade: {skipped_grade}, repost: {skipped_fp}, no keywords: {skipped_kw} ==="
    )


if __name__ == "__main__":
    main()
