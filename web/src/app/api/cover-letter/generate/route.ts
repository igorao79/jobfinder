import { auth } from "@/lib/auth";
import { db } from "@/db";
import { resumes, coverLetters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { parseJobUrl } from "@/lib/job-parser";
import { extractResumeText } from "@/lib/resume-parser";
import { generateCoverLetter, improveCoverLetter } from "@/lib/cover-letter";
import { checkATS } from "@/lib/ats-checker";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = await request.json();
  const { jobUrl } = body;

  if (!jobUrl || typeof jobUrl !== "string") {
    return NextResponse.json(
      { error: "Укажите ссылку на вакансию" },
      { status: 400 }
    );
  }

  // Check user has a resume
  const userResume = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, session.user.id))
    .limit(1);

  if (userResume.length === 0) {
    return NextResponse.json(
      { error: "Сначала загрузите резюме в профиле" },
      { status: 400 }
    );
  }

  try {
    // 1. Parse job posting
    const jobData = await parseJobUrl(jobUrl);

    // 2. Extract resume text
    const resumeText = await extractResumeText(userResume[0].filePath);

    // 3. Generate cover letter
    let letter = await generateCoverLetter(resumeText, jobData);

    // 4. ATS check
    let atsResult = checkATS(letter, jobData);

    // 5. If score < 70, try to improve once
    if (atsResult.score < 70 && atsResult.feedback.length > 0) {
      letter = await improveCoverLetter(letter, atsResult.feedback, jobData);
      atsResult = checkATS(letter, jobData);
    }

    // 6. Save to database
    await db.insert(coverLetters).values({
      userId: session.user.id,
      jobUrl,
      jobTitle: jobData.title,
      company: jobData.company,
      content: letter,
      atsScore: atsResult.score,
    });

    return NextResponse.json({
      content: letter,
      atsScore: atsResult.score,
      jobTitle: jobData.title,
      company: jobData.company,
      feedback: atsResult.feedback,
    });
  } catch (err: unknown) {
    console.error("Cover letter generation error:", err);
    const message =
      err instanceof Error ? err.message : "Ошибка генерации письма";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
