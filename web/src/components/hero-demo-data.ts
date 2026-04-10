export interface Persona {
  name: string;
  role: string;
  fileName: string;
  fileSize: string;
  skills: string[];
  experience: string;
  companies: string;
  vacancy: string;
  company: string;
  salary: string;
  keywords: string[];
  letterGreeting: string;
  letterBody: string[];
}

export const PERSONAS: Persona[] = [
  {
    name: "Алексей Волков",
    role: "Frontend Developer",
    fileName: "volkov_aleksey_cv.pdf",
    fileSize: "312 КБ",
    skills: ["React", "TypeScript", "Next.js"],
    experience: "4 года коммерческого опыта",
    companies: "Яндекс, Сбер, стартапы",
    vacancy: "Frontend-разработчик",
    company: "ГК Инновации · Москва",
    salary: "от 180 000 ₽ · Полная занятость",
    keywords: ["React", "TypeScript", "REST API", "Git", "Docker"],
    letterGreeting: "Уважаемый HR-менеджер,",
    letterBody: [
      "Меня заинтересовала вакансия",
      "Frontend-разработчика в вашей",
      "компании «ГК Инновации».",
      "",
      "Имею 4 года опыта работы с",
      "React, TypeScript и Next.js...",
    ],
  },
  {
    name: "Мария Петрова",
    role: "Backend Developer",
    fileName: "petrova_maria_cv.pdf",
    fileSize: "287 КБ",
    skills: ["Python", "Django", "PostgreSQL"],
    experience: "5 лет коммерческого опыта",
    companies: "Mail.ru, Тинькофф",
    vacancy: "Python-разработчик",
    company: "Ozon Tech · Москва",
    salary: "от 220 000 ₽ · Удалённо",
    keywords: ["Python", "Django", "PostgreSQL", "Redis", "Docker"],
    letterGreeting: "Здравствуйте,",
    letterBody: [
      "Пишу вам по поводу вакансии",
      "Python-разработчика в Ozon",
      "Tech.",
      "",
      "За 5 лет в backend-разработке",
      "я специализировалась на Django...",
    ],
  },
  {
    name: "Дмитрий Ковалёв",
    role: "DevOps Engineer",
    fileName: "kovalev_dmitry_cv.pdf",
    fileSize: "245 КБ",
    skills: ["Kubernetes", "AWS", "Terraform"],
    experience: "3 года коммерческого опыта",
    companies: "VK Cloud, Selectel",
    vacancy: "DevOps-инженер",
    company: "Авито · Москва",
    salary: "от 250 000 ₽ · Гибрид",
    keywords: ["K8s", "AWS", "Terraform", "CI/CD", "Linux"],
    letterGreeting: "Добрый день,",
    letterBody: [
      "Рассматриваю вакансию DevOps-",
      "инженера в Авито.",
      "",
      "Мой опыт включает построение",
      "CI/CD пайплайнов и управление",
      "инфраструктурой в Kubernetes...",
    ],
  },
  {
    name: "Анна Смирнова",
    role: "Fullstack Developer",
    fileName: "smirnova_anna_cv.pdf",
    fileSize: "298 КБ",
    skills: ["Node.js", "React", "MongoDB"],
    experience: "6 лет коммерческого опыта",
    companies: "Kaspersky, EPAM",
    vacancy: "Fullstack-разработчик",
    company: "Wildberries · Удалённо",
    salary: "от 200 000 ₽ · Полная занятость",
    keywords: ["Node.js", "React", "MongoDB", "TypeScript", "GraphQL"],
    letterGreeting: "Уважаемая команда,",
    letterBody: [
      "Заинтересовала вакансия",
      "Fullstack-разработчика в",
      "Wildberries.",
      "",
      "Имею 6 лет опыта построения",
      "веб-приложений на Node.js...",
    ],
  },
  {
    name: "Кирилл Новиков",
    role: "Mobile Developer",
    fileName: "novikov_kirill_cv.pdf",
    fileSize: "271 КБ",
    skills: ["React Native", "Swift", "Kotlin"],
    experience: "3 года коммерческого опыта",
    companies: "СберЗдоровье, Dodo",
    vacancy: "Mobile-разработчик",
    company: "Яндекс Go · Москва",
    salary: "от 190 000 ₽ · Офис",
    keywords: ["React Native", "Swift", "Kotlin", "Firebase", "Git"],
    letterGreeting: "Здравствуйте,",
    letterBody: [
      "Пишу по поводу вакансии",
      "Mobile-разработчика в Яндекс",
      "Go.",
      "",
      "За 3 года разработал несколько",
      "мобильных приложений на RN...",
    ],
  },
];

export const ATS_CHECKS = [
  { label: "Ключевые слова", score: 92 },
  { label: "Структура письма", score: 88 },
  { label: "Длина текста", score: 95 },
  { label: "Релевантность опыта", score: 90 },
];

export const STAGES = [
  { id: "upload", label: "Загрузка резюме", duration: 2500 },
  { id: "parse", label: "Анализ вакансии", duration: 3000 },
  { id: "generate", label: "Генерация письма", duration: 3500 },
  { id: "ats", label: "Проверка ATS", duration: 2500 },
  { id: "invite", label: "Приглашение", duration: 3000 },
] as const;
