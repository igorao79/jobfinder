import fs from "fs/promises";
import path from "path";

export async function extractResumeText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = await fs.readFile(filePath);

  if (ext === ".pdf") {
    // Import pdf-parse/lib/pdf-parse directly to avoid the test-file bug in index.js
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse") as (
      buf: Buffer
    ) => Promise<{ text: string; numpages: number }>;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(
    `Формат ${ext} не поддерживается. Используйте PDF или DOCX`
  );
}
