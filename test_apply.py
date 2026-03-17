#!/usr/bin/env python3
"""
Тесты автоотклика — проверяет логин, чтение вакансии, поиск кнопки отклика.
Запуск: python test_apply.py

Тесты:
  1. Логин на hh.ru (реальный вход с куки)
  2. Поиск вакансий через API (убеждаемся, что есть кандидаты)
  3. Открытие страницы вакансии в браузере
  4. Поиск кнопки "Откликнуться"
  5. Проверка поля сопроводительного письма (без отправки!)
  6. Dry-run: полный цикл без финального клика

Переменные окружения (или .env):
  HH_PHONE, HH_PASSWORD, AUTO_APPLY_ENABLED=true
"""

import os
import sys
import io
import json
import time
import random
import logging

# Фикс кодировки для Windows консоли
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Подтягиваем модули проекта
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from auto_apply import (
    HH_PHONE, HH_PASSWORD, COOKIES_FILE,
    _load_cookies, _save_cookies, _login, _is_logged_in,
    _simulate_reading, _random_mouse_movement,
    COVER_LETTER,
)

# ========== Утилиты тестов ==========

PASS = "\u2705"
FAIL = "\u274c"
WARN = "\u26a0\ufe0f"
INFO = "\u2139\ufe0f"

results = []


def test_result(name, passed, detail=""):
    status = PASS if passed else FAIL
    results.append((name, passed, detail))
    msg = f"  {status} {name}"
    if detail:
        msg += f" — {detail}"
    print(msg)
    return passed


# ========== Тест 1: Проверка конфигурации ==========

def test_config():
    print(f"\n{'='*50}")
    print(f"{INFO} Тест 1: Проверка конфигурации")
    print(f"{'='*50}")

    test_result(
        "HH_PHONE задан",
        bool(HH_PHONE),
        HH_PHONE[:4] + "****" if HH_PHONE else "НЕ ЗАДАН"
    )
    test_result(
        "HH_PASSWORD задан",
        bool(HH_PASSWORD),
        "***" if HH_PASSWORD else "НЕ ЗАДАН"
    )
    test_result(
        "Сопроводительное письмо",
        len(COVER_LETTER) > 100,
        f"{len(COVER_LETTER)} символов"
    )

    try:
        from playwright.sync_api import sync_playwright
        test_result("Playwright установлен", True)
    except ImportError:
        test_result("Playwright установлен", False, "pip install playwright && playwright install chromium")
        return False

    return bool(HH_PHONE and HH_PASSWORD)


# ========== Тест 2: Поиск вакансий через API ==========

def test_api_search():
    print(f"\n{'='*50}")
    print(f"{INFO} Тест 2: Поиск вакансий через API")
    print(f"{'='*50}")

    import requests

    try:
        resp = requests.get(
            "https://api.hh.ru/vacancies",
            params={"text": "python", "per_page": 5, "area": 1},
            headers={"HH-User-Agent": "TestBot/1.0"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", [])

        test_result("API hh.ru доступен", True, f"HTTP {resp.status_code}")
        test_result("Вакансии найдены", len(items) > 0, f"{len(items)} шт")

        if items:
            first = items[0]
            url = first.get("alternate_url", "")
            name = first.get("name", "")
            test_result("URL вакансии есть", bool(url), url[:60])
            return url, name

    except Exception as e:
        test_result("API hh.ru доступен", False, str(e))

    return None, None


# ========== Тест 3: Логин в браузере ==========

def test_login(page, context):
    print(f"\n{'='*50}")
    print(f"{INFO} Тест 3: Логин на hh.ru")
    print(f"{'='*50}")

    try:
        # Пробуем куки
        cookies_loaded = _load_cookies(context)
        test_result("Куки загружены из файла", cookies_loaded,
                    COOKIES_FILE if cookies_loaded else "файл не найден")

        logged_in = False

        if cookies_loaded:
            logged_in = _is_logged_in(page)
            test_result("Сессия по кукам", logged_in,
                        "валидна" if logged_in else "истекла")

        if not logged_in:
            print(f"  {INFO} Выполняем логин...")
            logged_in = _login(page)
            test_result("Логин по паролю", logged_in,
                        page.url if logged_in else "не удалось")

            if logged_in:
                _save_cookies(context)
                test_result("Куки сохранены", True)

        return logged_in

    except Exception as e:
        test_result("Логин", False, str(e))
        return False


# ========== Тест 4: Открытие вакансии + поиск кнопки ==========

def test_vacancy_page(page, vacancy_url, vacancy_name):
    print(f"\n{'='*50}")
    print(f"{INFO} Тест 4: Страница вакансии")
    print(f"{'='*50}")

    print(f"  {INFO} URL: {vacancy_url}")
    print(f"  {INFO} Название: {vacancy_name}")

    try:
        page.goto(vacancy_url, wait_until="domcontentloaded")
        time.sleep(2)

        test_result("Страница загружена", True, page.url[:60])

        # Проверяем основные элементы
        title = page.locator('[data-qa="vacancy-title"]')
        has_title = False
        try:
            has_title = title.is_visible(timeout=3000)
        except Exception:
            pass
        test_result("Название вакансии на странице", has_title)

        # Имитация чтения
        print(f"  {INFO} Имитация чтения вакансии...")
        _simulate_reading(page)
        _random_mouse_movement(page)
        test_result("Имитация чтения", True, "скролл + мышь")

        # Скроллим наверх перед поиском кнопки
        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(1)

        # Ищем кнопку отклика (может быть несколько с одним data-qa)
        respond_btn = None
        btn_type = ""
        already = False

        # Сначала проверяем vacancy-response-link-top (может быть несколько)
        btn_top_all = page.locator('[data-qa="vacancy-response-link-top"]')
        try:
            count = btn_top_all.count()
            print(f"  {INFO} Найдено {count} кнопок vacancy-response-link-top")
            for i in range(count):
                btn = btn_top_all.nth(i)
                if btn.is_visible(timeout=1000):
                    respond_btn = btn
                    btn_type = f"top[{i}]"
                    break
        except Exception:
            pass

        if not respond_btn:
            btn_bottom = page.locator('[data-qa="vacancy-response-link-bottom"]')
            try:
                if btn_bottom.first.is_visible(timeout=2000):
                    respond_btn = btn_bottom.first
                    btn_type = "bottom"
            except Exception:
                pass

        if not respond_btn:
            try:
                already_applied = page.locator('text="Вы откликнулись"')
                already = already_applied.is_visible(timeout=2000)
            except Exception:
                pass

        if respond_btn:
            test_result("Кнопка 'Откликнуться' найдена", True, f"позиция: {btn_type}")
        elif already:
            test_result("Кнопка 'Откликнуться'", True, "уже откликались ранее")
        else:
            test_result("Кнопка 'Откликнуться' найдена", False, "не найдена")

        return respond_btn, already

    except Exception as e:
        test_result("Страница вакансии", False, str(e))
        return None, False


# ========== Тест 5: Dry-run отклика (без отправки) ==========

def test_dry_run_apply(page, respond_btn):
    print(f"\n{'='*50}")
    print(f"{INFO} Тест 5: Dry-run отклика (БЕЗ отправки)")
    print(f"{'='*50}")

    if not respond_btn:
        print(f"  {WARN} Пропуск — кнопка отклика не найдена")
        return

    try:
        # Наводимся на кнопку
        respond_btn.hover()
        time.sleep(0.5)
        test_result("Hover на кнопку", True)

        # Кликаем
        respond_btn.click()
        time.sleep(2)
        test_result("Клик по кнопке 'Откликнуться'", True)

        # Ищем модалку / форму отклика
        found_letter_field = False

        # Кнопка "Добавить сопроводительное"
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
                    toggle.click()
                    time.sleep(1)
                    test_result("Кнопка 'Добавить сопроводительное'", True, sel)
                    break
            except Exception:
                continue

        # Ищем textarea
        letter_selectors = [
            '[data-qa="vacancy-response-popup-form-letter-input"]',
            'textarea[name="letter"]',
            '[data-qa="vacancy-response-letter"]',
            'textarea',
        ]

        for sel in letter_selectors:
            try:
                textarea = page.locator(sel).first
                if textarea.is_visible(timeout=2000):
                    found_letter_field = True
                    test_result("Поле сопроводительного письма", True, sel)

                    # Пишем первые 50 символов как тест (не отправляем!)
                    textarea.click()
                    time.sleep(0.3)
                    test_text = COVER_LETTER[:50]
                    textarea.type(test_text, delay=random.randint(10, 30))
                    test_result("Ввод текста в поле", True, f"'{test_text[:30]}...'")
                    break
            except Exception:
                continue

        if not found_letter_field:
            test_result("Поле сопроводительного письма", False, "не найдено")

        # Ищем кнопку отправки (но НЕ нажимаем!)
        submit_selectors = [
            '[data-qa="vacancy-response-submit-popup"]',
            '[data-qa="vacancy-response-letter-submit"]',
            'button:has-text("Откликнуться")',
        ]

        found_submit = False
        for sel in submit_selectors:
            try:
                btn = page.locator(sel).first
                if btn.is_visible(timeout=2000):
                    found_submit = True
                    test_result("Кнопка отправки отклика", True, f"{sel} (НЕ нажимаем!)")
                    break
            except Exception:
                continue

        if not found_submit:
            test_result("Кнопка отправки отклика", False, "не найдена")

        # Выбор резюме
        try:
            resume = page.locator('[data-qa="resume-select-item"]').first
            if resume.is_visible(timeout=2000):
                test_result("Выбор резюме", True, "модалка с резюме обнаружена")
        except Exception:
            pass

        print(f"\n  {WARN} DRY-RUN: отклик НЕ отправлен!")

    except Exception as e:
        test_result("Dry-run отклика", False, str(e))


# ========== Тест 6: Скриншот для отладки ==========

def test_screenshot(page, name="test_screenshot"):
    print(f"\n{'='*50}")
    print(f"{INFO} Тест 6: Скриншот для отладки")
    print(f"{'='*50}")

    try:
        path = f"{name}.png"
        page.screenshot(path=path, full_page=False)
        test_result("Скриншот сохранён", True, path)
    except Exception as e:
        test_result("Скриншот", False, str(e))


# ========== Main ==========

def main():
    print("\n" + "=" * 50)
    print("  ТЕСТЫ АВТООТКЛИКА hh.ru")
    print("  Режим: DRY-RUN (отклик НЕ отправляется)")
    print("=" * 50)

    # Тест 1
    config_ok = test_config()
    if not config_ok:
        print(f"\n{FAIL} Конфигурация не готова. Задайте переменные окружения:")
        print("  export HH_PHONE='+7...'")
        print("  export HH_PASSWORD='...'")
        print("  export AUTO_APPLY_ENABLED='true'")
        sys.exit(1)

    # Тест 2
    vacancy_url, vacancy_name = test_api_search()
    if not vacancy_url:
        print(f"\n{FAIL} Не удалось найти вакансии через API")
        sys.exit(1)

    # Тесты 3-6: всё в одном контексте Playwright
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 720},
            locale="ru-RU",
            timezone_id="Europe/Moscow",
        )
        page = context.new_page()

        try:
            # Тест 3
            logged_in = test_login(page, context)
            if not logged_in:
                print(f"\n{FAIL} Логин не удался")
                return 1

            # Тест 4
            respond_btn, already = test_vacancy_page(page, vacancy_url, vacancy_name)

            # Тест 5
            if not already:
                test_dry_run_apply(page, respond_btn)
            else:
                print(f"\n  {WARN} Пропуск dry-run — уже откликались на эту вакансию")

            # Тест 6
            test_screenshot(page)

        finally:
            browser.close()

    # Итоги
    print(f"\n{'='*50}")
    print("  ИТОГИ")
    print(f"{'='*50}")

    passed = sum(1 for _, p, _ in results if p)
    failed = sum(1 for _, p, _ in results if not p)
    total = len(results)

    print(f"\n  {PASS} Пройдено: {passed}/{total}")
    if failed:
        print(f"  {FAIL} Провалено: {failed}/{total}")
        print(f"\n  Проваленные тесты:")
        for name, p, detail in results:
            if not p:
                print(f"    {FAIL} {name}: {detail}")

    print()
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
