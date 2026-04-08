import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-5">
      <div className="text-center max-w-md animate-scale-in">
        <span className="font-display text-[120px] font-bold text-[var(--primary)] opacity-10 leading-none select-none block">
          404
        </span>
        <h2 className="font-display text-2xl font-bold text-[var(--fg)] tracking-tight -mt-6">
          Страница не найдена
        </h2>
        <p className="text-[var(--fg-muted)] text-sm mt-3 leading-relaxed">
          Страница, которую вы ищете, не существует или была перемещена.
        </p>
        <Link href="/" className="btn-primary mt-6">
          На главную
        </Link>
      </div>
    </div>
  );
}
