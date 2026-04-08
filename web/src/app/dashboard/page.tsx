import { auth } from "@/lib/auth";
import { db } from "@/db";
import { resumes, coverLetters } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const [resumeRows, letterRows] = await Promise.all([
    db.select({ count: count() }).from(resumes).where(eq(resumes.userId, userId)),
    db.select({ count: count() }).from(coverLetters).where(eq(coverLetters.userId, userId)),
  ]);

  const resumeCount = resumeRows[0]?.count ?? 0;
  const letterCount = letterRows[0]?.count ?? 0;
  const hasResume = resumeCount > 0;

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 md:py-14">
      {/* Welcome */}
      <div className="animate-fade-up">
        <span className="text-[var(--primary)] text-[13px] font-bold tracking-widest uppercase">
          Добро пожаловать
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--fg)] tracking-tight mt-2">
          Привет, {session.user.name?.split(" ")[0]}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 animate-fade-up delay-100">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[var(--fg-subtle)] uppercase tracking-wider">
                Резюме
              </p>
              <p className="font-display text-3xl font-bold text-[var(--fg)] mt-1">
                {hasResume ? "Загружено" : "—"}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              hasResume ? "bg-[var(--success-light)] text-[var(--success)]" : "bg-gray-100 text-[var(--fg-subtle)]"
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={hasResume
                  ? "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  : "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                } />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[var(--fg-subtle)] uppercase tracking-wider">
                Писем создано
              </p>
              <p className="font-display text-3xl font-bold text-[var(--fg)] mt-1">
                {letterCount}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Resume warning */}
      {!hasResume && (
        <div className="mt-6 animate-fade-up delay-200 card border-[var(--primary)]/20 bg-[var(--primary-light)] p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display font-bold text-[var(--fg)] text-[15px]">
                Загрузите резюме
              </h3>
              <p className="text-[var(--fg-muted)] text-sm mt-1 leading-relaxed">
                Для создания сопроводительных писем необходимо загрузить резюме в профиле.
              </p>
              <Link href="/profile" className="btn-primary !py-2 !px-5 !text-sm mt-4">
                Перейти в профиль
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up delay-300">
        <Link
          href="/generate"
          className="group relative card card-interactive bg-[var(--primary)] border-[var(--primary)] p-7 overflow-hidden"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/5" />
          <svg className="w-7 h-7 text-white/80 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          <h3 className="font-display font-bold text-white text-lg">
            Создать письмо
          </h3>
          <p className="text-white/60 text-sm mt-1.5">
            Вставьте URL вакансии и получите письмо
          </p>
          <div className="absolute bottom-4 right-4 text-white/30 group-hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </Link>

        <Link href="/history" className="group card card-interactive p-7">
          <svg className="w-7 h-7 text-[var(--fg-subtle)] mb-4 group-hover:text-[var(--primary)] transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-display font-bold text-[var(--fg)] text-lg">История</h3>
          <p className="text-[var(--fg-muted)] text-sm mt-1.5">
            Все ваши сопроводительные письма
          </p>
        </Link>

        <Link href="/profile" className="group card card-interactive p-7">
          <svg className="w-7 h-7 text-[var(--fg-subtle)] mb-4 group-hover:text-[var(--primary)] transition-colors" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <h3 className="font-display font-bold text-[var(--fg)] text-lg">Профиль</h3>
          <p className="text-[var(--fg-muted)] text-sm mt-1.5">
            Управление резюме и настройки
          </p>
        </Link>
      </div>
    </div>
  );
}
