"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

function getString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);
const MAX_DOCUMENT_SIZE_BYTES = 8 * 1024 * 1024;

export async function createLesson(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") {
    redirect("/teacher/login");
  }

  const levelId = getString(formData, "levelId");
  const title = getString(formData, "title");
  const type = getString(formData, "type");
  if (!levelId || !title || (type !== "VIDEO" && type !== "DOCUMENT" && type !== "AI_PAGE")) {
    redirect("/teacher/dashboard/lessons?error=Titre, niveau et type sont requis");
  }

  if (type === "VIDEO") {
    const videoUrl = getString(formData, "videoUrl");
    if (!videoUrl) {
      redirect("/teacher/dashboard/lessons?error=Lien vidéo requis pour une leçon vidéo");
    }
    await prisma.lesson.create({ data: { levelId, title, type: "VIDEO", videoUrl } });
  } else if (type === "DOCUMENT") {
    const file = formData.get("document");
    if (!(file instanceof File) || file.size === 0) {
      redirect("/teacher/dashboard/lessons?error=Document requis pour une leçon document");
    }
    if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) {
      redirect("/teacher/dashboard/lessons?error=Format de document non accepté (image ou PDF uniquement)");
    }
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      redirect("/teacher/dashboard/lessons?error=Document trop volumineux (8 Mo max)");
    }
    const documentData = Buffer.from(await file.arrayBuffer());
    await prisma.lesson.create({
      data: {
        levelId,
        title,
        type: "DOCUMENT",
        documentData,
        documentMimeType: file.type,
        documentFileName: file.name,
      },
    });
  } else {
    // AI_PAGE : contenu rédigé au moment de l'ajout (jamais généré en direct par un appel IA
    // payant), toujours basé sur l'une des deux autres sources (contentSourceUrl).
    const contentMarkdown = getString(formData, "contentMarkdown");
    const contentSourceUrl = getString(formData, "contentSourceUrl");
    if (!contentMarkdown || !contentSourceUrl) {
      redirect(
        "/teacher/dashboard/lessons?error=Contenu et source requis pour une page rédigée",
      );
    }
    await prisma.lesson.create({
      data: { levelId, title, type: "AI_PAGE", contentMarkdown, contentSourceUrl },
    });
  }

  redirect("/teacher/dashboard/lessons");
}

export async function deleteLesson(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") {
    redirect("/teacher/login");
  }

  const lessonId = getString(formData, "lessonId");
  if (!lessonId) redirect("/teacher/dashboard/lessons");

  await prisma.lesson.delete({ where: { id: lessonId } });
  redirect("/teacher/dashboard/lessons");
}
