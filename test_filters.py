#!/usr/bin/env python3
"""Тесты фильтрации вакансий — проверяем что нерелевантные вакансии отсекаются."""

import unittest
from main import (
    is_blacklisted_title,
    is_blacklisted_employer,
    detect_description_traps,
    LAYOUT_TITLE_BLACKLIST,
    FRONTEND_TITLE_BLACKLIST,
)


class TestTitleBlacklist(unittest.TestCase):
    """Тесты фильтра по названию вакансии."""

    # --- Должны быть ЗАБЛОКИРОВАНЫ ---

    def test_block_senior(self):
        self.assertTrue(is_blacklisted_title("Senior Frontend Developer"))

    def test_block_lead(self):
        self.assertTrue(is_blacklisted_title("Team Lead разработки"))

    def test_block_architect(self):
        self.assertTrue(is_blacklisted_title("Архитектор решений"))

    def test_block_analyst(self):
        self.assertTrue(is_blacklisted_title("Product Analyst/Data Analyst"))

    def test_block_manager(self):
        self.assertTrue(is_blacklisted_title("Менеджер проектов"))

    def test_block_designer(self):
        self.assertTrue(is_blacklisted_title("UI Дизайнер"))

    def test_block_mobile_ios(self):
        self.assertTrue(is_blacklisted_title("iOS разработчик"))

    def test_block_mobile_android(self):
        self.assertTrue(is_blacklisted_title("Android developer"))

    def test_block_mobile_flutter(self):
        self.assertTrue(is_blacklisted_title("Flutter developer"))

    def test_block_vue(self):
        self.assertTrue(is_blacklisted_title("Frontend-разработчик (Vue)"))

    def test_block_nuxt(self):
        self.assertTrue(is_blacklisted_title("Front-end разработчик (Nuxt)"))

    def test_block_angular(self):
        self.assertTrue(is_blacklisted_title("Angular developer"))

    def test_block_java(self):
        self.assertTrue(is_blacklisted_title("Java разработчик"))

    def test_block_golang(self):
        self.assertTrue(is_blacklisted_title("Golang developer"))

    def test_block_php(self):
        self.assertTrue(is_blacklisted_title("PHP разработчик Laravel"))

    def test_block_csharp(self):
        self.assertTrue(is_blacklisted_title("C# разработчик"))

    def test_block_dotnet(self):
        self.assertTrue(is_blacklisted_title(".NET developer"))

    def test_block_1c(self):
        self.assertTrue(is_blacklisted_title("Разработчик 1С"))

    def test_block_ruby(self):
        self.assertTrue(is_blacklisted_title("Ruby on Rails developer"))

    def test_block_editor(self):
        self.assertTrue(is_blacklisted_title("Выпускающий редактор (научные журналы)"))

    def test_block_director(self):
        self.assertTrue(is_blacklisted_title("Директор по разработке"))

    def test_block_hr(self):
        self.assertTrue(is_blacklisted_title("HR менеджер"))

    def test_block_sales(self):
        self.assertTrue(is_blacklisted_title("Sales manager"))

    def test_block_marketing(self):
        self.assertTrue(is_blacklisted_title("Маркетолог"))

    def test_block_data_scientist(self):
        self.assertTrue(is_blacklisted_title("Data Scientist"))

    def test_block_руководитель(self):
        self.assertTrue(is_blacklisted_title("Руководитель AI трансформации"))

    # --- Должны ПРОХОДИТЬ ---

    def test_pass_frontend_developer(self):
        self.assertFalse(is_blacklisted_title("Frontend разработчик"))

    def test_pass_fullstack(self):
        self.assertFalse(is_blacklisted_title("Fullstack developer"))

    def test_pass_react_developer(self):
        self.assertFalse(is_blacklisted_title("React developer"))

    def test_pass_python_developer(self):
        self.assertFalse(is_blacklisted_title("Python разработчик"))

    def test_pass_ai_developer(self):
        self.assertFalse(is_blacklisted_title("AI Developer"))

    def test_pass_web_developer(self):
        self.assertFalse(is_blacklisted_title("Web-разработчик"))

    def test_pass_junior_dev(self):
        self.assertFalse(is_blacklisted_title("Junior разработчик"))

    def test_pass_middle_dev(self):
        self.assertFalse(is_blacklisted_title("Middle разработчик"))

    def test_pass_верстальщик(self):
        self.assertFalse(is_blacklisted_title("HTML верстальщик"))


class TestLayoutBlacklist(unittest.TestCase):
    """Тесты фильтра для верстальщиков — отсекаем полиграфию и дизайн."""

    def _is_layout_blocked(self, title):
        return any(word in title.lower() for word in LAYOUT_TITLE_BLACKLIST)

    # --- Должны быть ЗАБЛОКИРОВАНЫ ---

    def test_block_editor_journals(self):
        self.assertTrue(self._is_layout_blocked("Выпускающий редактор (научные журналы)"))

    def test_block_designer(self):
        self.assertTrue(self._is_layout_blocked("Дизайнер-верстальщик"))

    def test_block_polygraphy(self):
        self.assertTrue(self._is_layout_blocked("Верстальщик полиграфии"))

    def test_block_publishing(self):
        self.assertTrue(self._is_layout_blocked("Верстальщик в издательство"))

    def test_block_magazine(self):
        self.assertTrue(self._is_layout_blocked("Верстальщик журнала"))

    def test_block_newspaper(self):
        self.assertTrue(self._is_layout_blocked("Верстальщик газеты"))

    def test_block_figma(self):
        self.assertTrue(self._is_layout_blocked("Figma дизайнер верстальщик"))

    def test_block_email(self):
        self.assertTrue(self._is_layout_blocked("Email верстальщик"))

    def test_block_book(self):
        self.assertTrue(self._is_layout_blocked("Верстальщик книг"))

    def test_block_content(self):
        self.assertTrue(self._is_layout_blocked("Контент-менеджер верстка"))

    def test_block_typography(self):
        self.assertTrue(self._is_layout_blocked("Типограф"))

    def test_block_copywriter(self):
        self.assertTrue(self._is_layout_blocked("Копирайтер-верстальщик"))

    # --- Должны ПРОХОДИТЬ ---

    def test_pass_html_verstka(self):
        self.assertFalse(self._is_layout_blocked("HTML верстальщик"))

    def test_pass_web_verstka(self):
        self.assertFalse(self._is_layout_blocked("Веб-верстальщик"))

    def test_pass_verstka_saytov(self):
        self.assertFalse(self._is_layout_blocked("Верстка сайтов"))

    def test_pass_junior_verstka(self):
        self.assertFalse(self._is_layout_blocked("Junior верстальщик"))

    def test_pass_html_css(self):
        self.assertFalse(self._is_layout_blocked("HTML/CSS разработчик"))


class TestFrontendBlacklist(unittest.TestCase):
    """Тесты доп. фильтра для фронтенд-вакансий."""

    def _is_frontend_blocked(self, title):
        return any(word in title.lower() for word in FRONTEND_TITLE_BLACKLIST)

    def test_block_backend(self):
        self.assertTrue(self._is_frontend_blocked("Backend developer"))

    def test_block_devops(self):
        self.assertTrue(self._is_frontend_blocked("DevOps Engineer"))

    def test_block_qa(self):
        self.assertTrue(self._is_frontend_blocked("QA тестировщик"))

    def test_block_gamedev(self):
        self.assertTrue(self._is_frontend_blocked("Game developer"))

    def test_pass_frontend(self):
        self.assertFalse(self._is_frontend_blocked("Frontend developer"))

    def test_pass_react(self):
        self.assertFalse(self._is_frontend_blocked("React разработчик"))


class TestEmployerBlacklist(unittest.TestCase):
    """Тесты фильтра по работодателю."""

    def test_block_mstech(self):
        v = {"employer": {"name": "MSTech L.L.C-FZ"}}
        self.assertTrue(is_blacklisted_employer(v))

    def test_block_mstech_lower(self):
        v = {"employer": {"name": "mstech"}}
        self.assertTrue(is_blacklisted_employer(v))

    def test_pass_normal(self):
        v = {"employer": {"name": "Яндекс"}}
        self.assertFalse(is_blacklisted_employer(v))

    def test_pass_empty(self):
        v = {"employer": {"name": ""}}
        self.assertFalse(is_blacklisted_employer(v))


class TestDescriptionTraps(unittest.TestCase):
    """Тесты детектора ловушек в описании."""

    def test_detect_test_task(self):
        traps = detect_description_traps("Для отклика выполните тестовое задание")
        self.assertTrue(len(traps) > 0)

    def test_detect_code_word(self):
        traps = detect_description_traps("В сопроводительном напишите кодовое слово BANANA")
        self.assertTrue(len(traps) > 0)

    def test_detect_ai_filter(self):
        traps = detect_description_traps("Пройти через наш AI-фильтр")
        self.assertTrue(len(traps) > 0)

    def test_detect_form(self):
        traps = detect_description_traps("Заполните анкету по ссылке")
        self.assertTrue(len(traps) > 0)

    def test_detect_send_resume_email(self):
        traps = detect_description_traps("Отправьте резюме на почту hr@company.com")
        self.assertTrue(len(traps) > 0)

    def test_clean_description(self):
        traps = detect_description_traps(
            "Ищем разработчика React/Next.js. Удалённая работа, гибкий график."
        )
        self.assertEqual(len(traps), 0)

    def test_empty(self):
        traps = detect_description_traps("")
        self.assertEqual(len(traps), 0)

    def test_none(self):
        traps = detect_description_traps(None)
        self.assertEqual(len(traps), 0)


class TestRealWorldVacancies(unittest.TestCase):
    """Тесты на реальных примерах вакансий, которые прорывались через фильтры."""

    def test_block_publishing_editor(self):
        """Выпускающий редактор научных журналов — НЕ разработка."""
        self.assertTrue(is_blacklisted_title("Выпускающий редактор (научные журналы)"))

    def test_block_product_analyst(self):
        """Product Analyst — не разработчик."""
        self.assertTrue(is_blacklisted_title("Product Analyst/Data Analyst (AB Platform Team)"))

    def test_block_ai_transformation_lead(self):
        """Руководитель AI трансформации — руководитель, не разработчик."""
        self.assertTrue(is_blacklisted_title("Руководитель AI трансформации в сфере маркетплейсов"))

    def test_block_mobile_dev(self):
        """Мобильная разработка — не наш стек."""
        self.assertTrue(is_blacklisted_title("Разработчик мобильных приложений (IOS/Android)"))

    def test_block_vue_frontend(self):
        """Vue — не владеем."""
        self.assertTrue(is_blacklisted_title("Frontend-разработчик (Vue)"))

    def test_block_nuxt_frontend(self):
        """Nuxt — не владеем."""
        self.assertTrue(is_blacklisted_title("Front-end разработчик (Nuxt)"))


if __name__ == "__main__":
    unittest.main()
