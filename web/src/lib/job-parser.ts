import * as cheerio from "cheerio";

export interface JobData {
  title: string;
  company: string;
  description: string;
  requirements: string[];
  keywords: string[];
}

export async function parseJobUrl(url: string): Promise<JobData> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Не удалось загрузить страницу вакансии: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove scripts and styles
  $("script, style, noscript").remove();

  // Try common selectors for job title
  const title =
    $('h1[data-qa="vacancy-title"]').text().trim() ||
    $("h1").first().text().trim() ||
    "Без названия";

  // Try common selectors for company name
  const company =
    $('[data-qa="vacancy-company-name"]').text().trim() ||
    $(".company-name").text().trim() ||
    $('meta[property="og:site_name"]').attr("content") ||
    "";

  // Get main content text
  const descriptionEl =
    $('[data-qa="vacancy-description"]') ||
    $(".vacancy-description") ||
    $("article") ||
    $("main");

  const description = descriptionEl.text().trim().slice(0, 5000);

  // Extract list items as requirements
  const requirements: string[] = [];
  descriptionEl.find("li").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10 && text.length < 300) {
      requirements.push(text);
    }
  });

  // Extract keywords from description
  const keywords = extractKeywords(description);

  return { title, company, description, requirements, keywords };
}

function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();

  // Common tech/skill keywords
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

  // Also extract capitalized words that might be technologies
  const capitalizedWords = text.match(/\b[A-Z][a-zA-Z+#.]{2,15}\b/g);
  if (capitalizedWords) {
    capitalizedWords
      .filter((w) => !["The", "This", "That", "With", "From", "For"].includes(w))
      .slice(0, 10)
      .forEach((w) => found.add(w.toLowerCase()));
  }

  return Array.from(found).slice(0, 30);
}
