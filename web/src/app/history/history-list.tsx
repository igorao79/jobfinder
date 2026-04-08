"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Letter {
  id: string;
  jobTitle: string | null;
  company: string | null;
  jobUrl: string;
  content: string;
  atsScore: number | null;
  createdAt: string;
}

export function HistoryList({ letters }: { letters: Letter[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Удалить это письмо?")) return;
    setDeletingId(id);

    const res = await fetch(`/api/cover-letter/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
    setDeletingId(null);
  }

  async function handleCopy(content: string, id: string) {
    await navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="mt-6 space-y-3">
      {letters.map((letter, i) => (
        <div
          key={letter.id}
          className={`card overflow-hidden transition-all duration-300 ${
            deletingId === letter.id ? "opacity-50 scale-[0.98]" : ""
          }`}
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Collapsed header */}
          <button
            onClick={() =>
              setExpandedId(expandedId === letter.id ? null : letter.id)
            }
            className="w-full text-left p-5 hover:bg-[var(--primary-glow)] transition-colors"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display font-bold text-[var(--fg)] text-[15px] truncate">
                  {letter.jobTitle || "Без названия"}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  {letter.company && (
                    <span className="text-[13px] text-[var(--fg-muted)]">
                      {letter.company}
                    </span>
                  )}
                  {letter.company && <span className="text-[var(--border)]">&middot;</span>}
                  <span className="text-[13px] text-[var(--fg-subtle)]">
                    {new Date(letter.createdAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {letter.atsScore !== null && (
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      letter.atsScore >= 80
                        ? "score-high"
                        : letter.atsScore >= 60
                        ? "score-mid"
                        : "score-low"
                    }`}
                  >
                    {letter.atsScore}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-[var(--fg-subtle)] transition-transform duration-300 ${
                    expandedId === letter.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          </button>

          {/* Expanded content */}
          {expandedId === letter.id && (
            <div className="border-t border-[var(--border)] animate-slide-down">
              <div className="p-5 relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--primary)]" />
                <pre className="whitespace-pre-wrap font-body text-[var(--fg)] text-[14px] leading-[1.75] pl-4">
                  {letter.content}
                </pre>
              </div>

              <div className="px-5 pb-5 flex gap-2">
                <button
                  onClick={() => handleCopy(letter.content, letter.id)}
                  className="btn-primary !py-2 !px-4 !text-[13px]"
                >
                  {copied === letter.id ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Скопировано
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                      Копировать
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(letter.id)}
                  className="btn-secondary !py-2 !px-4 !text-[13px] !text-[var(--primary)] !border-[var(--primary)]/20 hover:!bg-[var(--primary-light)]"
                >
                  Удалить
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
