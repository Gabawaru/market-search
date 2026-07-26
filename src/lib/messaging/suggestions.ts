import { prisma } from "@/lib/db/prisma";
import type { ParticipantRole } from "@/generated/prisma/client";

/** Un fil de suggestions par enfant, partagé entre le parent et l'enfant — distinct de la
 * messagerie enfant/prof/parent. Le scan IA (phase 8) lira ces messages pour les synthétiser. */
export async function getOrCreateSuggestionThreadForChild(childId: string) {
  const existing = await prisma.suggestionThread.findFirst({ where: { childId } });
  if (existing) return existing;

  const child = await prisma.child.findUniqueOrThrow({ where: { id: childId } });
  return prisma.suggestionThread.create({ data: { childId, parentId: child.parentId } });
}

export function postSuggestionMessage(threadId: string, authorRole: ParticipantRole, body: string) {
  return prisma.suggestionMessage.create({ data: { threadId, authorRole, body } });
}

export function listSuggestionMessages(threadId: string) {
  return prisma.suggestionMessage.findMany({ where: { threadId }, orderBy: { createdAt: "asc" } });
}
