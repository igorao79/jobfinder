"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-5">
      <div className="text-center max-w-md animate-scale-in">
        <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-[var(--primary)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="font-display text-2xl font-bold text-[var(--fg)] tracking-tight">
          Что-то пошло не так
        </h2>
        <p className="text-[var(--fg-muted)] text-sm mt-2 leading-relaxed">
          {error.message || "Произошла непредвиденная ошибка"}
        </p>
        <button onClick={reset} className="btn-primary mt-6">
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
