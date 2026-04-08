import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-auto">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                <span className="text-white font-display font-bold text-xs">JF</span>
              </div>
              <span className="font-display font-bold text-[16px] tracking-tight">
                Job<span className="text-[var(--primary)]">Finder</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-[var(--fg-muted)] leading-relaxed max-w-xs">
              Создаём персонализированные сопроводительные письма с помощью
              искусственного интеллекта и проверяем их через ATS.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-xs uppercase tracking-widest text-[var(--fg-subtle)] mb-4">
              Навигация
            </h4>
            <div className="flex flex-col gap-2.5">
              {[
                { href: "/dashboard", label: "Главная" },
                { href: "/generate", label: "Создать письмо" },
                { href: "/history", label: "История" },
                { href: "/profile", label: "Профиль" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[var(--fg-muted)] hover:text-[var(--primary)] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-display font-semibold text-xs uppercase tracking-widest text-[var(--fg-subtle)] mb-4">
              Технологии
            </h4>
            <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
              Groq AI для генерации писем. Автоматическая проверка через ATS-систему.
              Поддержка PDF и DOCX резюме.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--fg-subtle)]">
            &copy; {new Date().getFullYear()} JobFinder. Все права защищены.
          </p>
          <p className="text-xs text-[var(--fg-subtle)]">
            Создано с использованием Next.js и Groq AI
          </p>
        </div>
      </div>
    </footer>
  );
}
