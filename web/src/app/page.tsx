import Link from "next/link";
import { HeroDemo } from "@/components/hero-demo";

const steps = [
  {
    num: "01",
    title: "Загрузите резюме",
    description:
      "PDF или DOCX — мы извлечём ваш опыт, навыки и достижения для создания персонализированных писем.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Вставьте ссылку",
    description:
      "Скопируйте URL вакансии — мы автоматически извлечём требования, навыки и описание позиции.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Получите письмо",
    description:
      "ИИ создаст письмо, оптимизированное под ATS. Проверка ключевых слов, структуры и релевантности.",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

const stats = [
  { value: "95%", label: "ATS-совместимость" },
  { value: "<60с", label: "Время генерации" },
  { value: "∞", label: "Писем бесплатно" },
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* ── Hero ── */}
      <section className="relative bg-[var(--primary)] hero-noise overflow-hidden">
        {/* Geometric accents */}
        <div className="geo-accent w-[500px] h-[500px] -top-40 -right-40 opacity-[0.04]" />
        <div className="geo-accent w-[300px] h-[300px] bottom-20 -left-20 opacity-[0.06]" />
        <div className="absolute top-1/2 right-[10%] w-[1px] h-32 bg-white/10 -translate-y-1/2 hidden lg:block" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-24 md:py-36 lg:py-44">
          <div className="flex items-center justify-between gap-12">
          <div className="max-w-2xl flex-shrink-0">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 text-white/60 text-[13px] font-semibold tracking-widest uppercase mb-6">
                <span className="w-8 h-[1px] bg-white/40" />
                AI-Powered
              </span>
            </div>

            <h1 className="animate-fade-up delay-100 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold text-white leading-[1.1] tracking-tight">
              Идеальное письмо
              <br />
              <span className="text-white/70">за одну минуту</span>
            </h1>

            <p className="animate-fade-up delay-200 mt-6 text-white/65 text-lg md:text-xl leading-relaxed max-w-lg">
              Загрузите резюме, вставьте ссылку на вакансию — получите
              сопроводительное, проверенное через ATS.
            </p>

            <div className="animate-fade-up delay-300 mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center bg-white text-[var(--primary)] px-8 py-3.5 rounded-xl font-bold text-[15px] hover:bg-white/90 transition-all duration-200 shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 hover:-translate-y-0.5"
              >
                Начать бесплатно
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center border-2 border-white/25 text-white px-8 py-3.5 rounded-xl font-semibold text-[15px] hover:bg-white/10 hover:border-white/40 transition-all duration-200"
              >
                Как это работает
              </a>
            </div>

            {/* Stats row */}
            <div className="animate-fade-up delay-500 mt-16 flex gap-10 md:gap-14">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-2xl md:text-3xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-white/45 text-xs mt-1 tracking-wide uppercase">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive demo */}
          <div className="hidden lg:flex items-center justify-center animate-fade-up delay-400">
            <HeroDemo />
          </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-xl mx-auto mb-16 md:mb-20">
            <span className="inline-block text-[var(--primary)] text-[13px] font-bold tracking-widest uppercase mb-4">
              Процесс
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--fg)] tracking-tight">
              Три шага до идеального письма
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step, i) => (
              <div
                key={i}
                className="card card-hover group p-8 relative overflow-hidden"
              >
                {/* Step number */}
                <span className="absolute top-6 right-6 font-display text-[80px] font-bold text-[var(--primary)] opacity-[0.04] leading-none select-none">
                  {step.num}
                </span>

                <div className="w-14 h-14 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-[var(--primary)] group-hover:text-white">
                  {step.icon}
                </div>

                <div className="text-[var(--primary)] text-xs font-bold tracking-widest uppercase mb-2">
                  Шаг {step.num}
                </div>
                <h3 className="font-display text-xl font-bold text-[var(--fg)] mb-3">
                  {step.title}
                </h3>
                <p className="text-[var(--fg-muted)] text-[15px] leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="relative bg-[var(--fg)] rounded-3xl overflow-hidden px-8 py-16 md:px-16 md:py-20 text-center">
            {/* Decorative grid */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />

            <div className="relative">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
                Готовы начать?
              </h2>
              <p className="mt-4 text-white/50 text-lg max-w-md mx-auto">
                Зарегистрируйтесь через Google или GitHub и создайте первое
                письмо прямо сейчас.
              </p>
              <Link
                href="/auth/signin"
                className="mt-8 inline-flex items-center justify-center bg-[var(--primary)] text-white px-10 py-4 rounded-xl font-bold text-[15px] hover:bg-[var(--primary-hover)] transition-all duration-200 shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl hover:shadow-[var(--primary)]/30 hover:-translate-y-0.5"
              >
                Создать аккаунт бесплатно
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
