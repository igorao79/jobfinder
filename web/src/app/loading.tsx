export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-[3px] border-[var(--border)]" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[var(--primary)] animate-spin" />
        </div>
        <p className="text-[var(--fg-subtle)] text-sm font-medium">Загрузка...</p>
      </div>
    </div>
  );
}
