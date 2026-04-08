import type { JobData } from "./job-parser";

export interface ATSResult {
  score: number;
  feedback: string[];
}

export function checkATS(coverLetter: string, jobData: JobData): ATSResult {
  const feedback: string[] = [];
  let score = 100;

  const words = coverLetter.split(/\s+/);
  const wordCount = words.length;

  // 1. Length check (250-400 words ideal)
  if (wordCount < 150) {
    score -= 25;
    feedback.push(`Письмо слишком короткое (${wordCount} слов). Рекомендуется 250-400 слов.`);
  } else if (wordCount < 250) {
    score -= 10;
    feedback.push(`Письмо коротковато (${wordCount} слов). Рекомендуется 250-400 слов.`);
  } else if (wordCount > 500) {
    score -= 15;
    feedback.push(`Письмо слишком длинное (${wordCount} слов). Рекомендуется не более 400 слов.`);
  }

  // 2. Keyword match rate
  if (jobData.keywords.length > 0) {
    const letterLower = coverLetter.toLowerCase();
    const matched = jobData.keywords.filter((kw) => letterLower.includes(kw));
    const matchRate = matched.length / jobData.keywords.length;

    if (matchRate < 0.2) {
      score -= 30;
      feedback.push(
        `Низкий процент ключевых слов (${Math.round(matchRate * 100)}%). Добавьте: ${jobData.keywords.filter((kw) => !letterLower.includes(kw)).slice(0, 5).join(", ")}`
      );
    } else if (matchRate < 0.4) {
      score -= 15;
      feedback.push(
        `Средний процент ключевых слов (${Math.round(matchRate * 100)}%). Попробуйте добавить: ${jobData.keywords.filter((kw) => !letterLower.includes(kw)).slice(0, 3).join(", ")}`
      );
    }
  }

  // 3. Structure check
  const lines = coverLetter.split("\n").filter((l) => l.trim());
  const paragraphs = coverLetter.split(/\n\s*\n/).filter((p) => p.trim());

  if (paragraphs.length < 3) {
    score -= 10;
    feedback.push("Недостаточно абзацев. Рекомендуется 3-5 абзацев.");
  }

  // Check for greeting
  const firstLine = lines[0]?.toLowerCase() || "";
  const hasGreeting =
    firstLine.includes("уважаем") ||
    firstLine.includes("здравствуйте") ||
    firstLine.includes("добрый день") ||
    firstLine.includes("привет");
  if (!hasGreeting) {
    score -= 5;
    feedback.push("Отсутствует приветствие в начале письма.");
  }

  // Check for closing
  const lastLines = coverLetter.slice(-200).toLowerCase();
  const hasClosing =
    lastLines.includes("уважением") ||
    lastLines.includes("наилучшими") ||
    lastLines.includes("благодар") ||
    lastLines.includes("готов") ||
    lastLines.includes("рад") ||
    lastLines.includes("спасибо") ||
    lastLines.includes("нетерпением");
  if (!hasClosing) {
    score -= 5;
    feedback.push("Отсутствует заключительная фраза.");
  }

  // 4. Company/position mention
  if (jobData.company && !coverLetter.includes(jobData.company)) {
    score -= 5;
    feedback.push(`Название компании "${jobData.company}" не упоминается в письме.`);
  }

  // 5. Formatting issues
  if (coverLetter.includes("\t")) {
    score -= 5;
    feedback.push("Обнаружены символы табуляции. Используйте пробелы.");
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  return { score, feedback };
}
