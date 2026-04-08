import { auth } from "@/lib/auth";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ResumeUpload } from "./resume-upload";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userResumes = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, session.user.id))
    .limit(1);

  const currentResume = userResumes[0] ?? null;

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 md:py-14">
      <div className="animate-fade-up">
        <span className="text-[var(--primary)] text-[13px] font-bold tracking-widest uppercase">
          Аккаунт
        </span>
        <h1 className="font-display text-3xl font-bold text-[var(--fg)] tracking-tight mt-2">
          Профиль
        </h1>
      </div>

      {/* User card */}
      <div className="card p-6 mt-8 animate-fade-up delay-100">
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

      {/* Resume section */}
      <div className="mt-10 animate-fade-up delay-200">
        <h2 className="font-display text-xl font-bold text-[var(--fg)] tracking-tight">
          Резюме
        </h2>

        {/* Disclaimer */}
        <div className="mt-4 card border-[var(--warning)]/20 bg-[var(--warning-light)] p-5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-[var(--warning)] leading-relaxed font-medium">
              Ваше резюме должно быть полностью заполнено — включая опыт работы,
              навыки и образование. Чем подробнее, тем лучше результат.
            </p>
          </div>
        </div>

        {/* Current resume status */}
        {currentResume && (
          <div className="mt-4 card border-[var(--success)]/20 bg-[var(--success-light)] p-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--success)]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--success)]">
                  {currentResume.fileName}
                </p>
                <p className="text-xs text-[var(--success)]/70 mt-0.5">
                  Загружено {new Date(currentResume.uploadedAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        <ResumeUpload hasExisting={!!currentResume} />
      </div>
    </div>
  );
}
