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

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Удалить это письмо?")) return;
    setDeletingId(id);
    const res = await fetch(`/api/cover-letter/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    setDeletingId(null);
  }

  async function handleCopy(e: React.MouseEvent, content: string, id: string) {
    e.stopPropagation();
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
          {/* Row — always visible */}
          <div
            onClick={() =>
              setExpandedId(expandedId === letter.id ? null : letter.id)
            }
            className="flex items-center gap-3 p-4 sm:p-5 hover:bg-[var(--primary-glow)] transition-colors cursor-pointer"
          >
            {/* Info */}
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-[var(--fg)] text-[15px] truncate">
                {letter.jobTitle || "Без названия"}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {letter.company && (
                  <span className="text-[13px] text-[var(--fg-muted)] truncate">
                    {letter.company}
                  </span>
                )}
                {letter.company && (
                  <span className="text-[var(--border)]">&middot;</span>
                )}
                <span className="text-[13px] text-[var(--fg-subtle)] flex-shrink-0">
                  {new Date(letter.createdAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>

            {/* ATS badge */}
            {letter.atsScore !== null && (
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
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

            {/* Action icons — always visible */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Copy */}
              <button
                onClick={(e) => handleCopy(e, letter.content, letter.id)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  copied === letter.id
                    ? "bg-[var(--success-light)] text-[var(--success)]"
                    : "hover:bg-gray-100 text-[var(--fg-subtle)] hover:text-[var(--fg)]"
                }`}
                title="Копировать"
              >
                {copied === letter.id ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                )}
              </button>

              {/* Delete */}
              <button
                onClick={(e) => handleDelete(e, letter.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--fg-subtle)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
                title="Удалить"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>

              {/* Expand chevron */}
              <svg
                className={`w-4 h-4 text-[var(--fg-subtle)] transition-transform duration-300 ml-1 ${
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

          {/* Expanded content */}
          {expandedId === letter.id && (
            <div className="border-t border-[var(--border)] animate-slide-down">
              <div className="p-5 relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--primary)]" />
                <pre className="whitespace-pre-wrap font-body text-[var(--fg)] text-[14px] leading-[1.75] pl-4">
                  {letter.content}
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
