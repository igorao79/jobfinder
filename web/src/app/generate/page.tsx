"use client";

import { useState } from "react";
import Link from "next/link";

interface GenerateResult {
  content: string;
  atsScore: number;
  jobTitle: string | null;
  company: string | null;
  feedback?: string[];
}

export default function GeneratePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl: url }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка генерации");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 md:py-14">
      <div className="animate-fade-up">
        <span className="text-[var(--primary)] text-[13px] font-bold tracking-widest uppercase">
          AI-генератор
        </span>
        <h1 className="font-display text-3xl font-bold text-[var(--fg)] tracking-tight mt-2">
          Создать письмо
        </h1>
        <p className="text-[var(--fg-muted)] mt-2">
          Вставьте ссылку на вакансию — ИИ создаст персонализированное письмо
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleGenerate} className="mt-8 animate-fade-up delay-100">
        <div className="card p-6">
          <label className="block">
            <span className="text-sm font-semibold text-[var(--fg)]">
              Ссылка на вакансию
            </span>
            <div className="relative mt-2">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.832a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" />
                </svg>
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://hh.ru/vacancy/..."
                required
                className="input-field !pl-11"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="btn-primary w-full mt-5 !py-3.5 !text-[15px]"
          >
            {loading ? (
              <span className="flex items-center gap-2.5">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Анализируем вакансию и создаём письмо...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Создать письмо
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading shimmer */}
      {loading && (
        <div className="mt-8 animate-fade-in">
          <div className="card p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-4 rounded-lg"
                style={{
                  width: `${85 - i * 10}%`,
                  background: "linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%)",
                  backgroundSize: "200% 100%",
                  animation: `shimmer 1.5s infinite`,
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 animate-scale-in card border-[var(--primary)]/20 bg-[var(--primary-light)] p-5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-[var(--primary)] text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-8 space-y-5 animate-scale-in">
          {/* Header with score */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`px-4 py-2 rounded-xl text-sm font-bold ${
                result.atsScore >= 80
                  ? "score-high"
                  : result.atsScore >= 60
                  ? "score-mid"
                  : "score-low"
              }`}
            >
              ATS: {result.atsScore}/100
            </span>
            {result.jobTitle && (
              <span className="text-sm font-medium text-[var(--fg)]">
                {result.jobTitle}
              </span>
            )}
            {result.company && (
              <span className="text-sm text-[var(--fg-muted)]">
                @ {result.company}
              </span>
            )}
          </div>

          {/* Letter content */}
          <div className="card p-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--primary)]" />
            <pre className="whitespace-pre-wrap font-body text-[var(--fg)] text-[15px] leading-[1.75] pl-4">
              {result.content}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleCopy} className="btn-primary">
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Скопировано!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                  </svg>
                  Копировать
                </>
              )}
            </button>
            <Link href="/history" className="btn-secondary">
              Все письма
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
