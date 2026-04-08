"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function ResumeUpload({ hasExisting }: { hasExisting: boolean }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFile(file: File) {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!validTypes.includes(file.type) && ext !== "pdf" && ext !== "docx") {
      setError("Поддерживаются только PDF и DOCX. Файлы .doc нужно сконвертировать в .docx");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Максимальный размер файла — 5 МБ");
      return;
    }
    setError("");
    setFileName(file.name);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Ошибка загрузки");
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="mt-6">
      {/* Drop zone */}
      <label
        className={`card cursor-pointer block p-8 text-center transition-all duration-200 ${
          dragOver
            ? "border-[var(--primary)] bg-[var(--primary-light)] shadow-[0_0_0_3px_var(--primary-glow)]"
            : "border-dashed border-2 border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary-glow)]"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) {
            handleFile(file);
            const dt = new DataTransfer();
            dt.items.add(file);
            if (fileRef.current) fileRef.current.files = dt.files;
          }
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        {fileName ? (
          <>
            <p className="font-semibold text-[var(--fg)] text-[15px]">{fileName}</p>
            <p className="text-[var(--fg-muted)] text-sm mt-1">Нажмите для замены файла</p>
          </>
        ) : (
          <>
            <p className="font-semibold text-[var(--fg)] text-[15px]">
              Перетащите файл или нажмите для выбора
            </p>
            <p className="text-[var(--fg-muted)] text-sm mt-1">
              PDF, DOC, DOCX — до 5 МБ
            </p>
          </>
        )}
      </label>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-[var(--primary)] text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={uploading || !fileName}
        className="btn-primary w-full mt-5 !py-3.5"
      >
        {uploading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Загрузка...
          </span>
        ) : hasExisting ? (
          "Обновить резюме"
        ) : (
          "Загрузить резюме"
        )}
      </button>
    </form>
  );
}
