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

      {/* Create letter + Resume */}
      <div className="mt-8 animate-fade-up delay-200">
        <div
          className="rounded-2xl border border-[var(--primary)] p-7 overflow-hidden relative"
          style={{ background: "var(--primary)" }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative">
            <svg className="w-7 h-7 text-white/80 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <h3 className="font-display font-bold text-white text-xl">
              Создать письмо
            </h3>

            {/* Resume disclaimer */}
            <div className="mt-4 bg-white/10 rounded-xl p-3.5">
              <p className="text-white/70 text-[13px] leading-relaxed">
                Ваше резюме должно быть полностью заполнено — опыт, навыки, образование.
              </p>
            </div>

            {/* Current resume status */}
            {currentResume && (
              <div className="mt-3 bg-white/10 rounded-xl p-3.5">
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-[13px] font-semibold text-white">
                      {currentResume.fileName}
                    </p>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      Загружено {new Date(currentResume.uploadedAt).toLocaleDateString("ru-RU", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Resume upload */}
            <ResumeUpload hasExisting={!!currentResume} dark />

            {/* CTA button */}
            {hasResume && (
              <Link
                href="/generate"
                className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-white text-[var(--primary)] py-3.5 rounded-xl font-bold text-[15px] hover:bg-white/90 transition-all shadow-lg shadow-black/10"
              >
                Перейти к генерации
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
