import { auth } from "@/lib/auth";
import { db } from "@/db";
import { resumes, coverLetters } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";
import { ResumeUpload } from "../profile/resume-upload";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const [resumeRows, letterRows, userResumes] = await Promise.all([
    db.select({ count: count() }).from(resumes).where(eq(resumes.userId, userId)),
    db.select({ count: count() }).from(coverLetters).where(eq(coverLetters.userId, userId)),
    db.select().from(resumes).where(eq(resumes.userId, userId)).limit(1),
  ]);

  const resumeCount = resumeRows[0]?.count ?? 0;
  const letterCount = letterRows[0]?.count ?? 0;
  const hasResume = resumeCount > 0;
  const currentResume = userResumes[0] ?? null;

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
                  : "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
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

      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up delay-200">
        <Link
          href="/generate"
          className="group relative card card-interactive bg-[var(--primary)] border-[var(--primary)] p-7 overflow-hidden"
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/5" />
          <svg className="w-7 h-7 text-white/80 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          <h3 className="font-display font-bold text-white text-lg">Создать письмо</h3>
          <p className="text-white/60 text-sm mt-1.5">Вставьте URL вакансии и получите письмо</p>
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
          <p className="text-[var(--fg-muted)] text-sm mt-1.5">Все ваши сопроводительные письма</p>
        </Link>
      </div>

      {/* ── Profile section ── */}
      <div id="profile" className="mt-14 pt-10 border-t border-[var(--border)] animate-fade-up delay-300">
        <span className="text-[var(--primary)] text-[13px] font-bold tracking-widest uppercase">
          Профиль
        </span>

        {/* User card */}
        <div className="card p-6 mt-4">
          <div className="flex items-center gap-4">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-14 h-14 rounded-2xl ring-2 ring-[var(--border)] shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center">
                <span className="font-display font-bold text-[var(--primary)] text-lg">
                  {session.user.name?.[0] ?? "?"}
                </span>
              </div>
            )}
            <div>
              <h2 className="font-display font-bold text-[var(--fg)] text-lg">
                {session.user.name}
              </h2>
              <p className="text-[var(--fg-muted)] text-sm">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* Resume */}
        <div className="mt-8">
          <h3 className="font-display text-lg font-bold text-[var(--fg)] tracking-tight">
            Резюме
          </h3>

          <div className="mt-3 card border-[var(--warning)]/20 bg-[var(--warning-light)] p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-[var(--warning)] leading-relaxed font-medium">
                Ваше резюме должно быть полностью заполнено — опыт, навыки, образование.
              </p>
            </div>
          </div>

          {currentResume && (
            <div className="mt-3 card border-[var(--success)]/20 bg-[var(--success-light)] p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--success)]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--success)]">{currentResume.fileName}</p>
                  <p className="text-xs text-[var(--success)]/70 mt-0.5">
                    Загружено {new Date(currentResume.uploadedAt).toLocaleDateString("ru-RU", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <ResumeUpload hasExisting={!!currentResume} />
        </div>
      </div>
    </div>
  );
}
