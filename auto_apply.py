#!/usr/bin/env python3
"""
Автоотклик на вакансии hh.ru через Playwright (headless Chromium).
Имитация поведения живого пользователя + сопроводительное письмо.
"""

import os
import json
import logging
import time
import random

logger = logging.getLogger(__name__)

COOKIES_FILE = "hh_cookies.json"

HH_PHONE = os.environ.get("HH_PHONE", "")
HH_PASSWORD = os.environ.get("HH_PASSWORD", "")
AUTO_APPLY_ENABLED = os.environ.get("AUTO_APPLY_ENABLED", "false").lower() == "true"

COVER_LETTER = """Здравствуйте!

Меня заинтересовала ваша вакансия с возможностью удалённой работы. Последние два года занимаюсь коммерческой разработкой с фокусом на AI-инструменты.

Основной опыт — проектирование и реализация систем автоматизации с использованием LLM-агентов:

1. Разработал два приложения для автоматического создания SEO-оптимизированных лендингов под Google Ads. Первое — на Python с интеграцией внешних сервисов по API, второе — на Next.js. Оба проекта реализованы самостоятельно, от архитектуры до деплоя. Код находится в закрытом доступе — готов продемонстрировать на следующем этапе.

2. Активно применяю AI-агенты (Claude Code, Cursor) как инструменты ускорения разработки: от генерации и рефакторинга кода до отладки и написания тестов. Умею выстраивать эффективные рабочие процессы с LLM, контролировать качество генерируемого кода и интегрировать AI в production-пайплайны.

3. Веду собственную соцсеть и ряд других проектов — подробнее готов рассказать на созвоне.

GitHub: https://github.com/igorao79

Буду рад обсудить, чем могу быть полезен вашей команде.

С уважением, Горецкий Игорь""".strip()


# ========== Имитация живого пользователя ==========

def _human_delay(min_sec=0.5, max_sec=1.5):
    """Случайная пауза, как у реального пользователя."""
    time.sleep(random.uniform(min_sec, max_sec))


def _human_type(page, selector, text):
    """
    Печатает текст посимвольно с разной скоростью,
    иногда делая микропаузы (как будто думает).
    """
    element = page.locator(selector)
    element.click()
    _human_delay(0.3, 0.7)

    for i, char in enumerate(text):
        element.press_sequentially(char, delay=random.randint(30, 120))

        # Иногда делаем паузу "подумать" (примерно каждые 15-40 символов)
        if random.random() < 0.03:
            _human_delay(0.5, 1.5)


def _human_type_into(locator, text):
    """
    Печатает текст в конкретный locator посимвольно.
    """
    locator.click()
    _human_delay(0.2, 0.5)
    locator.press_sequentially(text, delay=random.randint(25, 90))


def _random_scroll(page):
    """Случайный скролл страницы — вверх или вниз, на разное расстояние."""
    direction = random.choice(["down", "down", "down", "up"])  # чаще вниз
    distance = random.randint(150, 600)
    if direction == "up":
        distance = -distance
    page.mouse.wheel(0, distance)
    _human_delay(0.5, 1.2)


def _simulate_reading(page):
    """
    Имитирует чтение вакансии: скроллит, останавливается,
    иногда возвращается наверх. Каждый раз разный сценарий.
    """
    scenarios = [
        _reading_slow_scroll,
        _reading_jump_scroll,
        _reading_skim_fast,
        _reading_back_and_forth,
    ]
    scenario = random.choice(scenarios)
    logger.info(f"Reading simulation: {scenario.__name__}")
    scenario(page)


def _reading_slow_scroll(page):
    """Медленно и вдумчиво читает сверху вниз."""
    scrolls = random.randint(3, 6)
    for _ in range(scrolls):
        page.mouse.wheel(0, random.randint(200, 400))
        _human_delay(1.5, 4.0)  # долго читает каждый блок


def _reading_jump_scroll(page):
    """Быстро проскакивает начало, потом замедляется на требованиях."""
    # Быстро пролистать шапку
    page.mouse.wheel(0, random.randint(400, 700))
    _human_delay(0.5, 1.0)
    page.mouse.wheel(0, random.randint(300, 500))
    _human_delay(0.3, 0.8)

    # Замедлиться на основном тексте
    for _ in range(random.randint(2, 4)):
        page.mouse.wheel(0, random.randint(100, 250))
        _human_delay(2.0, 5.0)


def _reading_skim_fast(page):
    """Бегло просматривает — быстрый скролл с короткими остановками."""
    for _ in range(random.randint(4, 7)):
        page.mouse.wheel(0, random.randint(250, 500))
        _human_delay(0.5, 1.5)


def _reading_back_and_forth(page):
    """Читает, потом возвращается наверх перечитать что-то."""
    # Сначала вниз
    for _ in range(random.randint(2, 4)):
        page.mouse.wheel(0, random.randint(200, 400))
        _human_delay(1.0, 3.0)

    # Возврат наверх
    page.mouse.wheel(0, random.randint(-800, -400))
    _human_delay(1.5, 3.0)

    # Снова вниз
    for _ in range(random.randint(1, 3)):
        page.mouse.wheel(0, random.randint(200, 500))
        _human_delay(1.0, 2.5)


def _random_mouse_movement(page):
    """Случайное движение мыши по странице."""
    x = random.randint(100, 1100)
    y = random.randint(100, 600)
    page.mouse.move(x, y, steps=random.randint(5, 15))
    _human_delay(0.1, 0.4)


def _simulate_hover_elements(page):
    """Случайно наводится на элементы страницы (как будто читает)."""
    selectors = [
        '[data-qa="vacancy-title"]',
        '[data-qa="vacancy-company-name"]',
        '[data-qa="vacancy-salary"]',
        '[data-qa="vacancy-experience"]',
        '[data-qa="vacancy-description"]',
    ]
    random.shuffle(selectors)

    for sel in selectors[:random.randint(1, 3)]:
        try:
            el = page.locator(sel).first
            if el.is_visible(timeout=1000):
                el.hover()
                _human_delay(0.5, 2.0)
        except Exception:
            pass


# ========== Основная логика ==========

def is_auto_apply_available():
    """Проверяет, доступен ли автоотклик."""
    if not AUTO_APPLY_ENABLED:
        return False
    if not HH_PHONE or not HH_PASSWORD:
        logger.warning("AUTO_APPLY enabled but HH_PHONE/HH_PASSWORD not set")
        return False
    try:
        from playwright.sync_api import sync_playwright  # noqa: F401
        return True
    except ImportError:
        logger.warning("Playwright not installed, auto-apply disabled")
        return False


def _save_cookies(context):
    """Сохраняет куки браузера в файл."""
    cookies = context.cookies()
    with open(COOKIES_FILE, "w") as f:
        json.dump(cookies, f, ensure_ascii=False)
    logger.info(f"Saved {len(cookies)} cookies")


def _load_cookies(context):
    """Загружает куки из файла."""
    try:
        with open(COOKIES_FILE, "r") as f:
            cookies = json.load(f)
        context.add_cookies(cookies)
        logger.info(f"Loaded {len(cookies)} cookies")
        return True
    except (FileNotFoundError, json.JSONDecodeError):
        return False


def _extract_phone_number(phone):
    """Извлекает номер без +7/8 для ввода в поле hh.ru."""
    phone = phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if phone.startswith("+7"):
        return phone[2:]
    if phone.startswith("8") and len(phone) == 11:
        return phone[1:]
    if phone.startswith("7") and len(phone) == 11:
        return phone[1:]
    return phone


def _login(page):
    """
    Логин на hh.ru — многошаговый флоу:
    1) Выбор роли "Я ищу работу" → "Войти"
    2) Ввод номера телефона
    3) "Войти с паролем"
    4) Ввод пароля → "Войти"
    """
    logger.info("Logging in to hh.ru...")

    # --- Шаг 1: Страница выбора роли ---
    page.goto("https://hh.ru/account/login", wait_until="domcontentloaded")
    _human_delay(2.0, 3.5)
    _random_mouse_movement(page)
    _human_delay(0.5, 1.0)

    # "Я ищу работу" уже выбрано по умолчанию — кликаем "Войти"
    try:
        submit_btn = page.locator('[data-qa="submit-button"]')
        if submit_btn.is_visible(timeout=5000):
            submit_btn.click()
            _human_delay(2.0, 3.0)
            logger.info("Step 1: Role selected, clicked 'Войти'")
    except Exception as e:
        logger.error(f"Step 1 failed: {e}")
        return False

    # --- Шаг 2: Ввод номера телефона ---
    phone_number = _extract_phone_number(HH_PHONE)
    try:
        phone_input = page.locator('[data-qa="magritte-phone-input-national-number-input"]')
        if phone_input.is_visible(timeout=5000):
            phone_input.click()
            _human_delay(0.3, 0.7)
            phone_input.press_sequentially(phone_number, delay=random.randint(50, 150))
            _human_delay(0.5, 1.0)
            logger.info(f"Step 2: Phone entered ({phone_number[:3]}****)")
        else:
            logger.error("Phone input not found")
            return False
    except Exception as e:
        logger.error(f"Step 2 failed: {e}")
        return False

    # --- Шаг 3: "Войти с паролем" ---
    try:
        pwd_btn = page.locator('[data-qa="expand-login-by-password"]')
        if pwd_btn.is_visible(timeout=5000):
            _random_mouse_movement(page)
            _human_delay(0.3, 0.8)
            pwd_btn.click()
            _human_delay(2.0, 3.0)
            logger.info("Step 3: Clicked 'Войти с паролем'")
        else:
            logger.error("'Войти с паролем' button not found")
            return False
    except Exception as e:
        logger.error(f"Step 3 failed: {e}")
        return False

    # --- Шаг 4: Ввод пароля ---
    try:
        password_input = page.locator('[data-qa="applicant-login-input-password"]')
        if not password_input.is_visible(timeout=5000):
            # fallback
            password_input = page.locator('input[type="password"]')

        if password_input.is_visible(timeout=3000):
            password_input.click()
            _human_delay(0.2, 0.5)
            password_input.press_sequentially(HH_PASSWORD, delay=random.randint(40, 130))
            _human_delay(0.5, 1.2)
            logger.info("Step 4: Password entered")
        else:
            logger.error("Password input not found")
            return False
    except Exception as e:
        logger.error(f"Step 4 failed: {e}")
        return False

    # --- Шаг 5: Нажимаем "Войти" ---
    try:
        submit_btn = page.locator('[data-qa="submit-button"]')
        _random_mouse_movement(page)
        _human_delay(0.3, 0.6)
        submit_btn.click()
        _human_delay(3.0, 5.0)
        logger.info("Step 5: Clicked 'Войти'")
    except Exception as e:
        logger.error(f"Step 5 failed: {e}")
        return False

    # --- Проверка ---
    # После логина hh.ru может остаться на том же URL но показать главную
    # Проверяем наличие элементов авторизованного пользователя
    _human_delay(1.0, 2.0)

    # Проверяем: если есть навигация соискателя — мы залогинены
    logged_in = False
    try:
        # Элементы, видимые только залогиненному пользователю
        auth_selectors = [
            '[data-qa="mainmenu_applicantProfile"]',
            '[data-qa="mainmenu_responses"]',
            'text="Резюме и профиль"',
            'text="Отклики"',
        ]
        for sel in auth_selectors:
            try:
                if page.locator(sel).first.is_visible(timeout=2000):
                    logged_in = True
                    break
            except Exception:
                continue
    except Exception:
        pass

    if not logged_in:
        # Fallback: пробуем перейти на главную и проверить
        page.goto("https://hh.ru", wait_until="domcontentloaded")
        _human_delay(1.5, 2.5)
        try:
            login_btn = page.locator('[data-qa="login"]')
            if login_btn.is_visible(timeout=3000):
                logger.error("Login failed — 'Войти' button still visible")
                try:
                    page.screenshot(path="login_failed.png")
                except Exception:
                    pass
                return False
            else:
                logged_in = True
        except Exception:
            logged_in = True  # Если кнопки "Войти" нет — значит залогинены

    if logged_in:
        logger.info(f"Login successful! URL: {page.url}")
        return True

    logger.error(f"Login status unclear. URL: {page.url}")
    return False


def _is_logged_in(page):
    """Проверяет, авторизован ли пользователь."""
    page.goto("https://hh.ru", wait_until="domcontentloaded")
    _human_delay(1.5, 2.5)

    # Проверяем наличие элементов авторизованного пользователя
    auth_selectors = [
        '[data-qa="mainmenu_applicantProfile"]',
        '[data-qa="mainmenu_responses"]',
    ]
    for sel in auth_selectors:
        try:
            if page.locator(sel).first.is_visible(timeout=2000):
                return True
        except Exception:
            continue

    # Fallback: если есть кнопка "Войти" — не залогинены
    try:
        login_btn = page.locator('[data-qa="login"]')
        if login_btn.is_visible(timeout=3000):
            return False
    except Exception:
        pass

    return True


def _fill_cover_letter(page):
    """
    Находит поле сопроводительного письма и заполняет его.
    hh.ru может показать его в модалке или на странице отклика.
    """
    letter_selectors = [
        '[data-qa="vacancy-response-popup-form-letter-input"]',
        '[data-qa="vacancy-response-letter-toggle"]',
        'textarea[name="letter"]',
        '[data-qa="vacancy-response-letter"]',
    ]

    # Сначала ищем кнопку "Добавить сопроводительное"
    toggle_selectors = [
        '[data-qa="vacancy-response-letter-toggle"]',
        'button:has-text("сопроводительное")',
        'button:has-text("Сопроводительное")',
        'a:has-text("сопроводительное")',
    ]

    for sel in toggle_selectors:
        try:
            toggle = page.locator(sel).first
            if toggle.is_visible(timeout=2000):
                _human_delay(0.5, 1.0)
                toggle.click()
                _human_delay(0.8, 1.5)
                logger.info("Opened cover letter field")
                break
        except Exception:
            continue

    # Теперь ищем textarea для письма
    for sel in letter_selectors:
        try:
            textarea = page.locator(sel).first
            if textarea.is_visible(timeout=2000):
                textarea.click()
                _human_delay(0.5, 1.0)

                # Печатаем сопроводительное посимвольно, но быстрее
                # (это длинный текст, полностью посимвольно слишком долго)
                # Разбиваем на абзацы и печатаем блоками с паузами
                paragraphs = COVER_LETTER.split("\n\n")
                for i, paragraph in enumerate(paragraphs):
                    lines = paragraph.split("\n")
                    for line in lines:
                        textarea.type(line, delay=random.randint(8, 25))
                        textarea.press("Enter")
                        _human_delay(0.1, 0.3)

                    if i < len(paragraphs) - 1:
                        textarea.press("Enter")
                        _human_delay(0.3, 1.0)  # пауза между абзацами

                logger.info("Cover letter filled")
                return True
        except Exception as e:
            logger.debug(f"Cover letter selector {sel} failed: {e}")
            continue

    # Fallback: пробуем найти любой textarea в модалке
    try:
        textarea = page.locator('textarea').first
        if textarea.is_visible(timeout=2000):
            textarea.click()
            _human_delay(0.5, 1.0)
            textarea.fill(COVER_LETTER)
            logger.info("Cover letter filled (fallback fill)")
            return True
    except Exception:
        pass

    logger.warning("Could not find cover letter field")
    return False


def apply_to_vacancy(vacancy_url, vacancy_name=""):
    """
    Откликается на вакансию по URL с имитацией живого пользователя.
    Возвращает: "applied", "already_applied", "failed", "no_button"
    """
    from playwright.sync_api import sync_playwright

    result = "failed"

    # Случайный viewport — как у разных мониторов
    viewports = [
        {"width": 1920, "height": 1080},
        {"width": 1536, "height": 864},
        {"width": 1440, "height": 900},
        {"width": 1366, "height": 768},
        {"width": 1280, "height": 720},
    ]

    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent=random.choice(user_agents),
            viewport=random.choice(viewports),
            locale="ru-RU",
            timezone_id="Europe/Moscow",
        )

        page = context.new_page()

        try:
            # Пробуем загрузить куки
            cookies_loaded = _load_cookies(context)

            if cookies_loaded:
                if not _is_logged_in(page):
                    logger.info("Cookies expired, re-logging in...")
                    cookies_loaded = False

            if not cookies_loaded:
                if not _login(page):
                    logger.error("Failed to login to hh.ru")
                    return "failed"
                _save_cookies(context)

            # --- Имитация: перед вакансией, может зайти на главную ---
            if random.random() < 0.3:
                logger.info("Simulating: visiting main page first")
                page.goto("https://hh.ru", wait_until="domcontentloaded")
                _human_delay(1.0, 2.5)
                _random_scroll(page)
                _random_mouse_movement(page)
                _human_delay(0.5, 1.5)

            # Переходим на страницу вакансии
            logger.info(f"Opening vacancy: {vacancy_url}")
            page.goto(vacancy_url, wait_until="domcontentloaded")
            _human_delay(1.5, 3.0)

            # --- Имитация чтения вакансии ---
            _simulate_reading(page)

            # Иногда наводимся на элементы
            if random.random() < 0.6:
                _simulate_hover_elements(page)

            # Случайное движение мыши
            for _ in range(random.randint(1, 3)):
                _random_mouse_movement(page)

            _human_delay(0.5, 1.5)

            # --- Ищем кнопку "Откликнуться" ---

            # Скроллим наверх к кнопке
            page.evaluate("window.scrollTo(0, 0)")
            _human_delay(0.8, 1.5)

            respond_btn = None

            # На странице может быть несколько элементов с одним data-qa
            btn_all = page.locator('[data-qa="vacancy-response-link-top"]')
            try:
                for i in range(btn_all.count()):
                    btn = btn_all.nth(i)
                    if btn.is_visible(timeout=2000):
                        respond_btn = btn
                        break
            except Exception:
                pass

            if not respond_btn:
                btn_bottom = page.locator('[data-qa="vacancy-response-link-bottom"]')
                try:
                    for i in range(btn_bottom.count()):
                        btn = btn_bottom.nth(i)
                        if btn.is_visible(timeout=2000):
                            respond_btn = btn
                            break
                except Exception:
                    pass

            if not respond_btn:
                # Может уже откликались
                already = page.locator('text="Вы откликнулись"')
                try:
                    if already.first.is_visible(timeout=2000):
                        logger.info(f"Already applied to: {vacancy_name}")
                        result = "already_applied"
                    else:
                        logger.warning(f"No apply button found for: {vacancy_name}")
                        result = "no_button"
                except Exception:
                    logger.warning(f"No apply button found for: {vacancy_name}")
                    result = "no_button"
                return result

            # Наводимся на кнопку перед кликом
            respond_btn.hover()
            _human_delay(0.3, 0.8)

            # Кликаем "Откликнуться"
            respond_btn.click()
            _human_delay(1.5, 3.0)

            # --- Сопроводительное письмо ---
            _fill_cover_letter(page)
            _human_delay(0.5, 1.5)

            # Может появиться модалка выбора резюме
            try:
                resume_item = page.locator('[data-qa="resume-select-item"]').first
                if resume_item.is_visible(timeout=3000):
                    _human_delay(0.5, 1.0)
                    resume_item.click()
                    _human_delay(0.8, 1.5)
            except Exception:
                pass

            # Кнопка подтверждения отклика
            submit_selectors = [
                '[data-qa="vacancy-response-submit-popup"]',
                '[data-qa="vacancy-response-letter-submit"]',
                'button:has-text("Откликнуться")',
                'button[type="submit"]',
            ]

            submitted = False
            for sel in submit_selectors:
                try:
                    btn = page.locator(sel).first
                    if btn.is_visible(timeout=2000):
                        btn.hover()
                        _human_delay(0.3, 0.7)
                        btn.click()
                        submitted = True
                        logger.info(f"Clicked submit button: {sel}")
                        break
                except Exception:
                    continue

            _human_delay(2.0, 4.0)

            # Проверяем результат
            try:
                success = page.locator('text="Вы откликнулись"')
                if success.is_visible(timeout=5000):
                    logger.info(f"Successfully applied to: {vacancy_name}")
                    result = "applied"
                else:
                    if "negotiations" in page.url or "responses" in page.url:
                        result = "applied"
                        logger.info(f"Applied (redirected): {vacancy_name}")
                    elif submitted:
                        logger.info(f"Apply likely succeeded (button clicked): {vacancy_name}")
                        result = "applied"
                    else:
                        logger.warning(f"Apply status unclear for: {vacancy_name}")
                        result = "failed"
            except Exception:
                if submitted:
                    result = "applied"

            # Сохраняем куки
            _save_cookies(context)

            # --- Имитация: после отклика немного задерживаемся ---
            if random.random() < 0.4:
                _random_scroll(page)
                _human_delay(0.5, 1.5)

        except Exception as e:
            logger.error(f"Error applying to {vacancy_name}: {e}")
            result = "failed"
        finally:
            browser.close()

    return result
