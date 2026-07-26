"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import {
  getOrCreateChildParentTeacherThread,
  getOrCreatePrivateThread,
  isThreadParticipant,
  sendChatMessage,
} from "@/lib/messaging/threads";
import {
  getOrCreateSuggestionThreadForChild,
  postSuggestionMessage,
} from "@/lib/messaging/suggestions";

function getString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

// ---------------------------------------------------------------------------
// Démarrage d'un fil parent → prof (partagé avec l'enfant, ou privé)
// ---------------------------------------------------------------------------

export async function startThreadWithTeacher(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }

  const childId = getString(formData, "childId");
  const teacherId = getString(formData, "teacherId");
  const isPrivate = formData.get("private") === "on";
  if (!teacherId) {
    redirect("/dashboard");
  }

  if (isPrivate) {
    const thread = await getOrCreatePrivateThread(session.user.id, teacherId);
    redirect(`/dashboard/messages/${thread.id}`);
  }

  if (!childId) {
    redirect("/dashboard");
  }
  const child = await prisma.child.findFirst({ where: { id: childId, parentId: session.user.id } });
  if (!child) {
    redirect("/dashboard");
  }

  const thread = await getOrCreateChildParentTeacherThread(childId, teacherId);
  redirect(`/dashboard/messages/${thread.id}`);
}

// ---------------------------------------------------------------------------
// Envoi de messages (un enfant/parent/prof ne peut écrire que dans un fil dont il fait
// partie — vérifié côté serveur à chaque envoi, jamais fait confiance à l'URL seule)
// ---------------------------------------------------------------------------

export async function sendChildMessage(formData: FormData) {
  const session = await getChildSession();
  if (!session) redirect("/child/select-profile");

  const threadId = getString(formData, "threadId");
  const body = getString(formData, "body");
  if (!threadId || !body) redirect("/app/messages");

  const allowed = await isThreadParticipant(threadId, "CHILD", session.childId);
  if (!allowed) redirect("/app/messages");

  await sendChatMessage({ threadId, senderRole: "CHILD", senderId: session.childId, body });
  redirect(`/app/messages/${threadId}`);
}

export async function sendParentMessage(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "PARENT") redirect("/parent/login");

  const threadId = getString(formData, "threadId");
  const body = getString(formData, "body");
  if (!threadId || !body) redirect("/dashboard");

  const allowed = await isThreadParticipant(threadId, "PARENT", session.user.id);
  if (!allowed) redirect("/dashboard");

  await sendChatMessage({ threadId, senderRole: "PARENT", senderId: session.user.id, body });
  redirect(`/dashboard/messages/${threadId}`);
}

export async function sendTeacherMessage(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const threadId = getString(formData, "threadId");
  const body = getString(formData, "body");
  if (!threadId || !body) redirect("/teacher/dashboard/messages");

  const allowed = await isThreadParticipant(threadId, "TEACHER", session.user.id);
  if (!allowed) redirect("/teacher/dashboard/messages");

  await sendChatMessage({ threadId, senderRole: "TEACHER", senderId: session.user.id, body });
  redirect(`/teacher/dashboard/messages/${threadId}`);
}

// ---------------------------------------------------------------------------
// Boîte à suggestions (parent/enfant)
// ---------------------------------------------------------------------------

export async function postChildSuggestion(formData: FormData) {
  const session = await getChildSession();
  if (!session) redirect("/child/select-profile");

  const body = getString(formData, "body");
  if (!body) redirect("/app/suggestions");

  const thread = await getOrCreateSuggestionThreadForChild(session.childId);
  await postSuggestionMessage(thread.id, "CHILD", body);
  redirect("/app/suggestions");
}

export async function postParentSuggestion(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "PARENT") redirect("/parent/login");

  const childId = getString(formData, "childId");
  const body = getString(formData, "body");
  if (!childId || !body) redirect("/dashboard");

  const child = await prisma.child.findFirst({ where: { id: childId, parentId: session.user.id } });
  if (!child) redirect("/dashboard");

  const thread = await getOrCreateSuggestionThreadForChild(childId);
  await postSuggestionMessage(thread.id, "PARENT", body);
  redirect(`/dashboard/${childId}/suggestions`);
}
