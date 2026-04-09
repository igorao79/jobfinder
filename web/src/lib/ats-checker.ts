import Groq from "groq-sdk";
import type { JobData } from "./job-parser";

export interface ATSResult {
  score: number;
  feedback: string[];
  details?: {
    keywordScore: number;
    structureScore: number;
    relevanceScore: number;
    toneScore: number;
    missingKeywords: string[];
  };
}

/**
 * Two-phase ATS check:
 * 1. Fast local checks (formatting, length, basic structure)
 * 2. Deep LLM analysis via Groq (keyword relevance, tone, semantic matching)
 */
export async function checkATS(
  coverLetter: string,
  jobData: JobData
): Promise<ATSResult> {
  // Phase 1: fast local checks
  const localResult = runLocalChecks(coverLetter, jobData);

  // Phase 2: LLM deep analysis
  try {
    const llmResult = await runLLMCheck(coverLetter, jobData);

    // Combine: weighted average (LLM is more accurate)
    const combinedScore = Math.round(
      localResult.score * 0.3 + llmResult.score * 0.7
    );

    return {
      score: Math.max(0, Math.min(100, combinedScore)),
      feedback: [...llmResult.feedback, ...localResult.feedback.filter(
        (f) => !llmResult.feedback.some((lf) => lf.includes(f.slice(0, 20)))
      )],
      details: llmResult.details,
    };
  } catch {
    // Fallback to local-only if LLM fails
    return localResult;
  }
}

/** Synchronous local check for backward compatibility */
export function checkATSLocal(
  coverLetter: string,
  jobData: JobData
): ATSResult {
  return runLocalChecks(coverLetter, jobData);
}

function runLocalChecks(coverLetter: string, jobData: JobData): ATSResult {
  const feedback: string[] = [];
  let score = 100;

  const words = coverLetter.split(/\s+/);
  const wordCount = words.length;

  // Length check
  if (wordCount < 150) {
    score -= 25;
    feedback.push(
      `Письмо слишком короткое (${wordCount} слов). Рекомендуется 250-400 слов.`
    );
  } else if (wordCount < 250) {
    score -= 10;
    feedback.push(
      `Письмо коротковато (${wordCount} слов). Рекомендуется 250-400 слов.`
    );
  } else if (wordCount > 500) {
    score -= 15;
    feedback.push(
      `Письмо слишком длинное (${wordCount} слов). Рекомендуется не более 400 слов.`
    );
  }

  // Keyword match (basic)
  if (jobData.keywords.length > 0) {
    const letterLower = coverLetter.toLowerCase();
    const matched = jobData.keywords.filter((kw) => letterLower.includes(kw));
    const matchRate = matched.length / jobData.keywords.length;

    if (matchRate < 0.2) {
      score -= 25;
      const missing = jobData.keywords
        .filter((kw) => !letterLower.includes(kw))
        .slice(0, 5);
      feedback.push(
        `Низкий процент ключевых слов (${Math.round(matchRate * 100)}%). Добавьте: ${missing.join(", ")}`
      );
    } else if (matchRate < 0.4) {
      score -= 10;
    }
  }

  // Structure
  const paragraphs = coverLetter.split(/\n\s*\n/).filter((p) => p.trim());
  if (paragraphs.length < 3) {
    score -= 10;
    feedback.push("Рекомендуется 3-5 абзацев для лучшей структуры.");
  }

  // Greeting
  const firstLine = coverLetter.split("\n")[0]?.toLowerCase() || "";
  const hasGreeting =
    firstLine.includes("уважаем") ||
    firstLine.includes("здравствуйте") ||
    firstLine.includes("добрый день");
  if (!hasGreeting) {
    score -= 5;
    feedback.push("Отсутствует формальное приветствие.");
  }

  // Closing
  const lastChunk = coverLetter.slice(-300).toLowerCase();
  const hasClosing =
    lastChunk.includes("уважением") ||
    lastChunk.includes("наилучшими") ||
    lastChunk.includes("благодар") ||
    lastChunk.includes("спасибо") ||
    lastChunk.includes("нетерпением") ||
    lastChunk.includes("готов");
  if (!hasClosing) {
    score -= 5;
    feedback.push("Отсутствует заключительная фраза.");
  }

  // Company mention
  if (jobData.company && !coverLetter.includes(jobData.company)) {
    score -= 5;
    feedback.push(`Компания «${jobData.company}» не упомянута в письме.`);
  }

  // Keyword stuffing (any keyword repeated >4 times)
  if (jobData.keywords.length > 0) {
    const letterLower = coverLetter.toLowerCase();
    const stuffed = jobData.keywords.filter((kw) => {
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      return (letterLower.match(regex) || []).length > 4;
    });
    if (stuffed.length > 0) {
      score -= 10;
      feedback.push(
        `Переспам ключевых слов: ${stuffed.join(", ")}. ATS может отклонить.`
      );
    }
  }

  // Generic phrases detection
  const genericPhrases = [
    "командный игрок",
    "стрессоустойчив",
    "быстро обучаюсь",
    "ответственный работник",
    "коммуникабельный",
    "легко обучаем",
  ];
  const foundGeneric = genericPhrases.filter((p) =>
    coverLetter.toLowerCase().includes(p)
  );
  if (foundGeneric.length > 0) {
    score -= 5;
    feedback.push(
      `Шаблонные фразы снижают эффективность: «${foundGeneric[0]}». Замените на конкретные достижения.`
    );
  }

  // Quantified achievements check
  const hasNumbers = /\d+\s*(%|процент|раз|год|месяц|проект|клиент|человек)/i.test(
    coverLetter
  );
  if (!hasNumbers) {
    score -= 5;
    feedback.push(
      "Нет измеримых достижений. Добавьте цифры (например, «увеличил конверсию на 30%»)."
    );
  }

  // Formatting
  if (coverLetter.includes("\t")) {
    score -= 3;
    feedback.push("Табуляция может нарушить парсинг ATS.");
  }

  return { score: Math.max(0, Math.min(100, score)), feedback };
}

async function runLLMCheck(
  coverLetter: string,
  jobData: JobData
): Promise<ATSResult> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `Ты — эксперт по ATS-системам (Applicant Tracking Systems). Проанализируй сопроводительное письмо кандидата на соответствие вакансии.

ВАКАНСИЯ:
Название: ${jobData.title}
Компания: ${jobData.company}
Описание: ${jobData.description.slice(0, 2000)}
Ключевые навыки из вакансии: ${jobData.keywords.join(", ")}

СОПРОВОДИТЕЛЬНОЕ ПИСЬМО:
${coverLetter}

Оцени письмо по 4 критериям (каждый от 0 до 100):

1. **keywordScore** — Насколько хорошо использованы ключевые слова из вакансии? Учитывай семантическое сходство (например, "разработка на React" и "React-разработчик" — это совпадение). Штрафуй за переспам одного слова (>4 раз).

2. **structureScore** — Правильная ли структура? Приветствие, 3-4 абзаца, заключение. Длина 250-400 слов. Нет ли форматирования, которое сломает ATS-парсер.

3. **relevanceScore** — Насколько опыт кандидата релевантен вакансии? Есть ли конкретные примеры и измеримые достижения? Не выдумано ли что-то?

4. **toneScore** — Профессиональный ли тон? Не слишком ли формально/неформально? Нет ли шаблонных клише ("командный игрок", "стрессоустойчивый")?

Также укажи:
- **missingKeywords** — список из 3-5 самых важных ключевых слов из вакансии, которые ОТСУТСТВУЮТ в письме
- **feedback** — массив из 2-4 конкретных рекомендаций по улучшению (на русском)

Ответь СТРОГО в JSON формате, без markdown:
{"keywordScore":85,"structureScore":90,"relevanceScore":75,"toneScore":88,"missingKeywords":["docker","kubernetes"],"feedback":["Добавьте опыт работы с Docker","Укажите конкретные метрики"]}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);

  const keywordScore = clamp(parsed.keywordScore ?? 70);
  const structureScore = clamp(parsed.structureScore ?? 70);
  const relevanceScore = clamp(parsed.relevanceScore ?? 70);
  const toneScore = clamp(parsed.toneScore ?? 70);

  const avgScore = Math.round(
    keywordScore * 0.35 +
      structureScore * 0.2 +
      relevanceScore * 0.3 +
      toneScore * 0.15
  );

  return {
    score: avgScore,
    feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
    details: {
      keywordScore,
      structureScore,
      relevanceScore,
      toneScore,
      missingKeywords: Array.isArray(parsed.missingKeywords)
        ? parsed.missingKeywords
        : [],
    },
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
