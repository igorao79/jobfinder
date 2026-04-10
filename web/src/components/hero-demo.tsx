"use client";

import { useState, useEffect } from "react";

const STAGES = [
  { id: "upload", label: "Загрузка резюме", duration: 2500 },
  { id: "parse", label: "Анализ вакансии", duration: 3000 },
  { id: "generate", label: "Генерация письма", duration: 3500 },
  { id: "ats", label: "Проверка ATS", duration: 2500 },
  { id: "invite", label: "Приглашение", duration: 3000 },
] as const;

const RESUME_LINES = [
  { text: "Алексей Волков", bold: true },
  { text: "Frontend Developer", bold: false },
  { text: "─────────────────────", dim: true },
  { text: "React · TypeScript · Next.js", bold: false },
  { text: "Node.js · PostgreSQL · Docker", bold: false },
  { text: "4 года коммерческого опыта", bold: false },
  { text: "─────────────────────", dim: true },
  { text: "Опыт: Яндекс, Сбер, стартапы", bold: false },
];

const VACANCY_LINES = [
  { text: "Frontend-разработчик", bold: true },
  { text: "ГК Инновации · Москва", bold: false },
  { text: "─────────────────────", dim: true },
  { text: "React, TypeScript, REST API", bold: false },
  { text: "от 180 000 ₽ · Полная занятость", bold: false },
  { text: "Офис / Гибрид · от 2 лет опыта", bold: false },
  { text: "─────────────────────", dim: true },
  { text: "Ключевые навыки:", bold: false },
];

const LETTER_LINES = [
  "Уважаемый HR-менеджер,",
  "",
  "Меня заинтересовала вакансия",
  "Frontend-разработчика в вашей",
  "компании «ГК Инновации».",
  "",
  "Имею 4 года опыта работы с",
  "React, TypeScript и Next.js...",
];

const ATS_CHECKS = [
  { label: "Ключевые слова", score: 92 },
  { label: "Структура письма", score: 88 },
  { label: "Длина текста", score: 95 },
  { label: "Релевантность опыта", score: 90 },
];

export function HeroDemo() {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [typedLines, setTypedLines] = useState(0);
  const [atsIndex, setAtsIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setTimeout(() => {
      if (stage < STAGES.length - 1) {
        setStage((s) => s + 1);
        setProgress(0);
        setTypedLines(0);
        setAtsIndex(0);
      } else {
        setIsPaused(true);
        setTimeout(() => {
          setStage(0);
          setProgress(0);
          setTypedLines(0);
          setAtsIndex(0);
          setIsPaused(false);
        }, 4000);
      }
    }, STAGES[stage].duration);
    return () => clearTimeout(timer);
  }, [stage, isPaused]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 100));
    }, STAGES[stage].duration / 50);
    return () => clearInterval(interval);
  }, [stage, isPaused]);

  useEffect(() => {
    if (stage !== 2) return;
    const interval = setInterval(() => {
      setTypedLines((l) => Math.min(l + 1, LETTER_LINES.length));
    }, 350);
    return () => clearInterval(interval);
  }, [stage]);

  useEffect(() => {
    if (stage !== 3) return;
    const interval = setInterval(() => {
      setAtsIndex((i) => Math.min(i + 1, ATS_CHECKS.length));
    }, 450);
    return () => clearInterval(interval);
  }, [stage]);

  const isFinished = isPaused && stage === STAGES.length - 1;

  return (
    <div className="relative w-[400px] select-none">
      <div className="absolute -inset-6 bg-white/[0.03] rounded-[32px] blur-2xl" />

      <div className="relative bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.03]">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-white/15" />
            <div className="w-3 h-3 rounded-full bg-white/15" />
            <div className="w-3 h-3 rounded-full bg-white/15" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[12px] text-white/35 font-mono tracking-wider">
              JobFinder AI
            </span>
          </div>
        </div>

        {/* Progress steps */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex gap-1.5">
            {STAGES.map((s, i) => (
              <div key={s.id} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: i < stage ? "100%" : i === stage ? `${progress}%` : "0%",
                    background: i <= stage
                      ? "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))"
                      : "transparent",
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2.5">
            <div className="relative w-5 h-5 flex-shrink-0">
              {isFinished ? (
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <div className="absolute inset-0 rounded-full border-2 border-white/25 border-t-white/80 animate-spin" />
              )}
            </div>
            <span className="text-[13px] font-semibold text-white/70 tracking-wide">
              {isFinished ? "Готово!" : STAGES[stage].label}
            </span>
          </div>
        </div>

        {/* Fixed-height content area */}
        <div className="px-5 pb-5 pt-1 h-[310px] relative">
          {/* Stage 0: Resume */}
          <div
            className="absolute inset-x-5 top-1 transition-opacity duration-300"
            style={{ opacity: stage === 0 ? 1 : 0, pointerEvents: stage === 0 ? "auto" : "none" }}
          >
            <div className="flex items-center gap-3 bg-white/[0.06] rounded-xl p-3.5 border border-white/[0.08]">
              <div className="w-11 h-14 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-white/50">PDF</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white/80 truncate">volkov_aleksey_cv.pdf</div>
                <div className="text-[11px] text-white/35 mt-0.5">312 КБ</div>
              </div>
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="mt-4 space-y-1.5">
              {RESUME_LINES.map((line, i) => (
                <div
                  key={i}
                  className="text-[12px] font-mono leading-relaxed"
                  style={{
                    color: line.bold ? "rgba(255,255,255,0.9)" : line.dim ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.5)",
                    opacity: stage === 0 ? 1 : 0,
                    transform: stage === 0 ? "translateY(0)" : "translateY(8px)",
                    transition: `all 0.4s ease ${i * 80}ms`,
                  }}
                >
                  {line.text}
                </div>
              ))}
            </div>
          </div>

          {/* Stage 1: Vacancy */}
          <div
            className="absolute inset-x-5 top-1 transition-opacity duration-300"
            style={{ opacity: stage === 1 ? 1 : 0, pointerEvents: stage === 1 ? "auto" : "none" }}
          >
            <div className="bg-white/[0.06] rounded-xl p-3.5 border border-white/[0.08]">
              <div className="flex items-center gap-2">
                {/* Search icon */}
                <svg className="w-4 h-4 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <span className="text-[12px] text-white/40 font-mono truncate">hh.ru/vacancy/131478268</span>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {VACANCY_LINES.map((line, i) => (
                <div
                  key={i}
                  className="text-[12px] font-mono leading-relaxed"
                  style={{
                    color: line.bold ? "rgba(255,255,255,0.9)" : line.dim ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.5)",
                    opacity: stage === 1 ? 1 : 0,
                    transform: stage === 1 ? "translateY(0)" : "translateY(8px)",
                    transition: `all 0.4s ease ${i * 80}ms`,
                  }}
                >
                  {line.text}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["React", "TypeScript", "REST API", "Git", "Docker"].map((kw, i) => (
                <span
                  key={kw}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-white/60 font-medium"
                  style={{
                    opacity: stage === 1 ? 1 : 0,
                    transform: stage === 1 ? "scale(1)" : "scale(0.8)",
                    transition: `all 0.3s ease ${700 + i * 80}ms`,
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Stage 2: Letter generation */}
          <div
            className="absolute inset-x-5 top-1 transition-opacity duration-300"
            style={{ opacity: stage === 2 ? 1 : 0, pointerEvents: stage === 2 ? "auto" : "none" }}
          >
            <div className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.08] h-[250px]">
              <div className="space-y-1.5">
                {LETTER_LINES.slice(0, stage === 2 ? typedLines : 0).map((line, i) => (
                  <div
                    key={i}
                    className="text-[12px] font-mono leading-relaxed"
                    style={{ color: i === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)" }}
                  >
                    {line || "\u00A0"}
                  </div>
                ))}
                {stage === 2 && typedLines < LETTER_LINES.length && (
                  <span className="inline-block w-[7px] h-[16px] bg-white/60 animate-pulse rounded-sm" />
                )}
              </div>
            </div>
            {/* Spinner below letter */}
            <div className="mt-3 flex items-center gap-2.5">
              <div className="relative w-4 h-4 flex-shrink-0">
                <div className="absolute inset-0 rounded-full border-[1.5px] border-white/15 border-t-white/50 animate-spin" />
              </div>
              <span className="text-[11px] text-white/30 font-medium">Groq AI генерирует...</span>
            </div>
          </div>

          {/* Stage 3: ATS */}
          <div
            className="absolute inset-x-5 top-1 transition-opacity duration-300"
            style={{ opacity: stage === 3 ? 1 : 0, pointerEvents: stage === 3 ? "auto" : "none" }}
          >
            <div className="space-y-4 pt-1">
              {ATS_CHECKS.map((check, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] text-white/60 font-medium">{check.label}</span>
                    <span
                      className="text-[12px] font-bold text-green-400"
                      style={{
                        opacity: stage === 3 && i < atsIndex ? 1 : 0,
                        transition: "opacity 0.3s ease",
                      }}
                    >
                      {check.score}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-300"
                      style={{
                        width: stage === 3 && i < atsIndex ? `${check.score}%` : "0%",
                        transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  </div>
                </div>
              ))}
              <div
                className="flex items-center justify-center gap-2.5 bg-green-500/10 border border-green-500/20 rounded-xl py-3"
                style={{
                  opacity: stage === 3 && atsIndex >= ATS_CHECKS.length ? 1 : 0,
                  transform: stage === 3 && atsIndex >= ATS_CHECKS.length ? "scale(1)" : "scale(0.95)",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[14px] font-bold text-green-400">ATS: 91/100</span>
              </div>
            </div>
          </div>

          {/* Stage 4: Invite from HH */}
          <div
            className="absolute inset-x-5 top-1 transition-opacity duration-300"
            style={{ opacity: stage === 4 ? 1 : 0, pointerEvents: stage === 4 ? "auto" : "none" }}
          >
            <div className="flex flex-col items-center justify-center h-[290px]">
              {/* HH logo badge */}
              <div
                className="w-14 h-14 rounded-2xl bg-[#D6001C] flex items-center justify-center mb-5"
                style={{
                  opacity: stage === 4 ? 1 : 0,
                  transform: stage === 4 ? "scale(1)" : "scale(0.5)",
                  transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <span className="text-white font-bold text-lg">hh</span>
              </div>

              {/* Message card */}
              <div
                className="bg-white/[0.08] rounded-xl border border-white/[0.12] p-5 w-full"
                style={{
                  opacity: stage === 4 ? 1 : 0,
                  transform: stage === 4 ? "translateY(0)" : "translateY(16px)",
                  transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[11px] text-white/40 font-mono">Новое сообщение</span>
                </div>
                <p className="text-[13px] text-white/90 font-semibold leading-snug">
                  ГК Инновации
                </p>
                <p className="text-[12px] text-white/60 leading-relaxed mt-2">
                  Здравствуйте, Алексей! Ваше сопроводительное письмо произвело отличное впечатление. Мы готовы пригласить вас на следующий этап — техническое собеседование.
                </p>
                <div className="mt-4 flex gap-2">
                  <div className="flex-1 bg-green-500/20 border border-green-500/30 rounded-lg py-2 text-center">
                    <span className="text-[12px] font-semibold text-green-400">Принять</span>
                  </div>
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 text-center">
                    <span className="text-[12px] font-medium text-white/40">Позже</span>
                  </div>
                </div>
              </div>

              {/* Confetti dots */}
              <div
                className="flex gap-1.5 mt-4"
                style={{
                  opacity: stage === 4 ? 1 : 0,
                  transition: "opacity 0.5s ease 0.6s",
                }}
              >
                {["bg-green-400", "bg-yellow-400", "bg-blue-400", "bg-green-400", "bg-pink-400"].map((color, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${color}`}
                    style={{
                      opacity: 0.6,
                      animation: stage === 4 ? `pulse-ring 1.5s ease ${i * 0.15}s infinite` : "none",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
