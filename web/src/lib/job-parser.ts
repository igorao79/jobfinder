import * as cheerio from "cheerio";

export interface JobData {
  title: string;
  company: string;
  description: string;
  requirements: string[];
  keywords: string[];
}

/**
 * Parse a job URL. Supports HH.ru via official API, falls back to HTML scraping for other sites.
 */
export async function parseJobUrl(url: string): Promise<JobData> {
  const hhMatch = url.match(/hh\.ru\/vacancy\/(\d+)/);
  if (hhMatch) {
    return parseHHVacancy(hhMatch[1]);
  }
  return parseGenericUrl(url);
}

/** Parse HH.ru vacancy via official API (no auth required) */
async function parseHHVacancy(vacancyId: string): Promise<JobData> {
  const res = await fetch(`https://api.hh.ru/vacancies/${vacancyId}`, {
    headers: { "User-Agent": "JobFinder/1.0 (cover-letter-generator)" },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Вакансия не найдена. Проверьте ссылку.");
    }
    throw new Error(`Ошибка API HH.ru: ${res.status}`);
  }

  const data = await res.json();

  // Strip HTML tags from description
  const $ = cheerio.load(data.description || "");
  const descriptionText = $.text().trim();

  // Extract list items as requirements
  const requirements: string[] = [];
  $("li").each((_, el) => {
    const text = cheerio.load(el).text().trim();
    if (text.length > 10 && text.length < 300) {
      requirements.push(text);
    }
  });

  // Build keywords from key_skills + description
  const keywords: string[] = [];
  if (data.key_skills) {
    for (const skill of data.key_skills) {
      keywords.push(skill.name.toLowerCase());
    }
  }
  // Add extracted keywords from description
  keywords.push(...extractKeywords(descriptionText));
  const uniqueKeywords = [...new Set(keywords)].slice(0, 30);

  return {
    title: data.name || "Без названия",
    company: data.employer?.name || "",
    description: descriptionText.slice(0, 5000),
    requirements,
    keywords: uniqueKeywords,
  };
}

/** Fallback: scrape HTML for non-HH.ru job sites */
async function parseGenericUrl(url: string): Promise<JobData> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Не удалось загрузить страницу: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();

  const title = $("h1").first().text().trim() || "Без названия";
  const company =
    $('meta[property="og:site_name"]').attr("content") || "";

  const descriptionEl = $("article").length ? $("article") : $("main").length ? $("main") : $("body");
  const description = descriptionEl.text().trim().slice(0, 5000);

  const requirements: string[] = [];
  descriptionEl.find("li").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && text.length < 300) {
      requirements.push(text);
    }
  });

  return {
    title,
    company,
    description,
    requirements,
    keywords: extractKeywords(description),
  };
}

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();

  const techPatterns = [
    /\b(?:javascript|typescript|python|java|c\+\+|go|rust|ruby|php|swift|kotlin)\b/gi,
    /\b(?:react|vue|angular|next\.?js|node\.?js|express|django|flask|spring)\b/gi,
    /\b(?:sql|postgresql|mysql|mongodb|redis|elasticsearch)\b/gi,
    /\b(?:docker|kubernetes|aws|gcp|azure|ci\/cd|git)\b/gi,
    /\b(?:html|css|sass|tailwind|bootstrap)\b/gi,
    /\b(?:rest|graphql|api|microservices|agile|scrum)\b/gi,
  ];

  const found = new Set<string>();
  for (const pattern of techPatterns) {
    const matches = lower.match(pattern);
    if (matches) {
      matches.forEach((m) => found.add(m.toLowerCase()));
    }
  }

  const capitalizedWords = text.match(/\b[A-Z][a-zA-Z+#.]{2,15}\b/g);
  if (capitalizedWords) {
    capitalizedWords
      .filter((w) => !["The", "This", "That", "With", "From", "For"].includes(w))
      .slice(0, 10)
      .forEach((w) => found.add(w.toLowerCase()));
  }

  return Array.from(found).slice(0, 30);
}
