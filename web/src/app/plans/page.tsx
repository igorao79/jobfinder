import Link from "next/link";

const freePlan = {
  name: "Бесплатный",
  price: "0 ₽",
  period: "навсегда",
  current: true,
  features: [
    { text: "3 письма в день", included: true },
    { text: "Базовая ATS-проверка", included: true },
    { text: "Загрузка резюме PDF/DOCX", included: true },
    { text: "Парсинг вакансий HH.ru", included: true },
    { text: "Приоритетная генерация", included: false },
    { text: "Расширенный ATS-анализ", included: false },
    { text: "Безлимитные письма", included: false },
    { text: "Шаблоны писем", included: false },
    { text: "Приоритетная поддержка", included: false },
  ],
};

const paidPlans = [
  { duration: "Неделя", price: "500", priceNum: 500, perDay: "71 ₽/день", popular: false },
  { duration: "Месяц", price: "2 000", priceNum: 2000, perDay: "67 ₽/день", popular: true },
  { duration: "Год", price: "10 000", priceNum: 10000, perDay: "27 ₽/день", popular: false },
];

const paidFeatures = [
  "Безлимитные письма",
  "Расширенный ATS-анализ с детальным отчётом",
  "Приоритетная генерация (быстрее в 2 раза)",
  "Шаблоны писем для разных отраслей",
  "Парсинг вакансий с любых сайтов",
  "Экспорт писем в PDF",
  "Приоритетная поддержка 24/7",
  "Ранний доступ к новым функциям",
];

export default function PlansPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 md:py-20">
      {/* Header */}
      <div className="text-center animate-fade-up">
        <span className="text-[var(--primary)] text-[13px] font-bold tracking-widest uppercase">
          Тарифы
        </span>
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--fg)] tracking-tight mt-3">
          Выберите свой план
        </h1>
        <p className="text-[var(--fg-muted)] text-lg mt-4 max-w-lg mx-auto">
          Начните бесплатно, перейдите на PRO когда будете готовы
        </p>
      </div>

      {/* Plans grid */}
      <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto animate-fade-up delay-100">
        {/* ── Free plan ── */}
        <div className="card p-8 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--fg-muted)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <h2 className="font-display font-bold text-[var(--fg)] text-xl">
                {freePlan.name}
              </h2>
              <span className="text-[12px] text-[var(--success)] font-semibold bg-[var(--success-light)] px-2 py-0.5 rounded-md">
                Ваш текущий план
              </span>
            </div>
          </div>

          <div className="mt-6">
            <span className="font-display text-4xl font-bold text-[var(--fg)]">0 ₽</span>
            <span className="text-[var(--fg-muted)] text-sm ml-2">навсегда</span>
          </div>

          <div className="mt-8 flex-1">
            <ul className="space-y-3">
              {freePlan.features.map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  {f.included ? (
                    <svg className="w-5 h-5 text-[var(--success)] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[var(--fg-subtle)]/40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-[14px] ${f.included ? "text-[var(--fg)]" : "text-[var(--fg-subtle)]"}`}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href="/dashboard"
            className="mt-8 w-full inline-flex items-center justify-center py-3.5 rounded-xl border-2 border-[var(--border)] text-[var(--fg-muted)] font-semibold text-[15px] hover:border-[var(--fg-subtle)] transition-colors"
          >
            Текущий план
          </Link>
        </div>

        {/* ── Paid plan ── */}
        <div
          className="rounded-2xl p-8 flex flex-col relative overflow-hidden border-2 border-[var(--primary)]"
          style={{ background: "var(--primary)" }}
        >
          {/* Decorative */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute bottom-10 -left-10 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-xl">PRO</h2>
                <span className="text-[12px] text-white/60 font-semibold bg-white/10 px-2 py-0.5 rounded-md">
                  Максимум возможностей
                </span>
              </div>
            </div>

            {/* Price options */}
            <div className="mt-6 grid grid-cols-3 gap-2">
              {paidPlans.map((plan) => (
                <div
                  key={plan.duration}
                  className={`rounded-xl p-3 text-center transition-all cursor-pointer ${
                    plan.popular
                      ? "bg-white/20 border-2 border-white/30 scale-[1.02]"
                      : "bg-white/10 border border-white/10 hover:bg-white/15"
                  }`}
                >
                  {plan.popular && (
                    <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider block mb-1">
                      Выгодно
                    </span>
                  )}
                  <p className="font-display font-bold text-white text-lg leading-tight">
                    {plan.price} ₽
                  </p>
                  <p className="text-white/50 text-[12px] mt-0.5">{plan.duration}</p>
                  <p className="text-white/40 text-[11px] mt-1">{plan.perDay}</p>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="mt-8">
              <ul className="space-y-3">
                {paidFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-[14px] text-white/85">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <button className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-white text-[var(--primary)] py-3.5 rounded-xl font-bold text-[15px] hover:bg-white/90 transition-all shadow-lg shadow-black/10 cursor-pointer">
              Оформить PRO
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* FAQ / trust */}
      <div className="mt-16 text-center animate-fade-up delay-200">
        <p className="text-[var(--fg-subtle)] text-sm">
          Все планы включают бесплатную загрузку резюме и парсинг вакансий HH.ru.
          <br />
          Оплата безопасна. Отмена подписки в любой момент.
        </p>
      </div>
    </div>
  );
}
