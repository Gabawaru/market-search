"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { createDevSuggestion } from "@/lib/devscan/suggestions";

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

/** Un prof ne peut pas déclencher la recherche/rédaction d'exercices lui-même — ça reste un vrai
 * travail de raisonnement, pas un script. Ce bouton crée juste une demande visible dans l'espace
 * développeur (même file que le reste des suggestions), traitée manuellement lors d'une prochaine
 * session — pas d'automatisation, mais une vraie trace au lieu de devoir redemander en direct. */
export async function requestCurationBatch(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") {
    redirect("/teacher/login");
  }

  const note = getString(formData, "note");

  await createDevSuggestion({
    category: "CONTENT",
    title: "Nouvelle curation d'exercices collège/lycée demandée",
    description: note
      ? `Demandée par ${session.user.name} (prof) : ${note}`
      : `Demandée par ${session.user.name} (prof) — nouveau lot d'exercices collège/lycée sourcés sur de vraies ressources académiques, à valider dans cet espace une fois proposés.`,
  });

  redirect("/teacher/dashboard/lessons?success=Demande envoyée");
}
