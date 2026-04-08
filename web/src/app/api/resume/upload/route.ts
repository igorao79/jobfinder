import { auth } from "@/lib/auth";
import { db } from "@/db";
import { resumes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
  }

  const validTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const ext = path.extname(file.name).toLowerCase();
  if (!validTypes.includes(file.type) && ext !== ".pdf" && ext !== ".docx") {
    return NextResponse.json(
      { error: "Поддерживаются только PDF и DOCX. Файлы .doc необходимо сконвертировать в .docx" },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Максимальный размер — 5 МБ" },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const uploadDir = path.join(process.cwd(), "uploads", userId);
  await fs.mkdir(uploadDir, { recursive: true });

  // Remove old files
  const existingFiles = await fs.readdir(uploadDir).catch(() => []);
  for (const f of existingFiles) {
    await fs.unlink(path.join(uploadDir, f)).catch(() => {});
  }

  const fileExt = path.extname(file.name);
  const fileName = `resume${fileExt}`;
  const filePath = path.join(uploadDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  // Upsert resume record
  const existing = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(resumes)
      .set({ filePath, fileName: file.name, uploadedAt: new Date() })
      .where(eq(resumes.userId, userId));
  } else {
    await db.insert(resumes).values({
      userId,
      filePath,
      fileName: file.name,
    });
  }

  return NextResponse.json({ fileName: file.name, uploadedAt: new Date() });
}
