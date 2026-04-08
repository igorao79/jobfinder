import { auth } from "@/lib/auth";
import { db } from "@/db";
import { coverLetters } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { HistoryList } from "./history-list";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const letters = await db
    .select()
    .from(coverLetters)
    .where(eq(coverLetters.userId, session.user.id))
    .orderBy(desc(coverLetters.createdAt));

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 md:py-14">
      <div className="flex items-end justify-between animate-fade-up">
        <div>
          <span className="text-[var(--primary)] text-[13px] font-bold tracking-widest uppercase">
            Архив
          </span>
          <h1 className="font-display text-3xl font-bold text-[var(--fg)] tracking-tight mt-2">
            История писем
          </h1>
        </div>
        {letters.length > 0 && (
          <span className="text-sm text-[var(--fg-subtle)] font-medium">
            {letters.length} {letters.length === 1 ? "письмо" : letters.length < 5 ? "письма" : "писем"}
          </span>
        )}
      </div>

      {letters.length === 0 ? (
        <div className="mt-10 animate-fade-up delay-100 card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[var(--fg-subtle)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z" />
            </svg>
          </div>
          <h3 className="font-display font-bold text-[var(--fg)] text-lg">
            Пока пусто
          </h3>
          <p className="text-[var(--fg-muted)] text-sm mt-2 max-w-xs mx-auto">
            Создайте первое сопроводительное письмо — оно появится здесь.
          </p>
          <Link href="/generate" className="btn-primary mt-6">
            Создать письмо
          </Link>
        </div>
      ) : (
        <div className="animate-fade-up delay-100">
          <HistoryList
            letters={letters.map((l) => ({
              id: l.id,
              jobTitle: l.jobTitle,
              company: l.company,
              jobUrl: l.jobUrl,
              content: l.content,
              atsScore: l.atsScore,
              createdAt: l.createdAt.toISOString(),
            }))}
          />
        </div>
      )}
    </div>
  );
}
