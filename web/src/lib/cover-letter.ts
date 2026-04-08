import Groq from "groq-sdk";
import type { JobData } from "./job-parser";

function getGroq() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export async function generateCoverLetter(
  resumeText: string,
  jobData: JobData
): Promise<string> {
  const prompt = `Ты — профессиональный карьерный консультант. Напиши сопроводительное письмо на русском языке.

ВАКАНСИЯ:
Название: ${jobData.title}
Компания: ${jobData.company}
Описание: ${jobData.description.slice(0, 3000)}
Ключевые требования: ${jobData.requirements.slice(0, 10).join("; ")}
Ключевые слова: ${jobData.keywords.join(", ")}

РЕЗЮМЕ КАНДИДАТА:
${resumeText.slice(0, 4000)}

ТРЕБОВАНИЯ К ПИСЬМУ:
- Длина: 250-400 слов
- Структура: приветствие, 2-3 абзаца по существу, заключение
- Используй ключевые слова из вакансии естественным образом
- Покажи, как опыт кандидата соответствует требованиям
- Будь профессиональным, но не формальным
- НЕ выдумывай факты — используй только информацию из резюме
- Письмо должно быть оптимизировано для ATS-систем (содержать ключевые слова из вакансии)

Напиши только текст письма, без заголовков и пояснений.`;

  const completion = await getGroq().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 1500,
  });

  return completion.choices[0]?.message?.content || "";
}

export async function improveCoverLetter(
  letter: string,
  feedback: string[],
  jobData: JobData
): Promise<string> {
  const prompt = `Улучши это сопроводительное письмо на основе обратной связи от ATS-системы.

ТЕКУЩЕЕ ПИСЬМО:
${letter}

ПРОБЛЕМЫ (ATS):
${feedback.join("\n")}

КЛЮЧЕВЫЕ СЛОВА ВАКАНСИИ: ${jobData.keywords.join(", ")}

Перепиши письмо, исправив указанные проблемы. Сохрани структуру и длину 250-400 слов.
Напиши только текст письма.`;

  const completion = await getGroq().chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    max_tokens: 1500,
  });

  return completion.choices[0]?.message?.content || letter;
}
