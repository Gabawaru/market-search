import { prisma } from "@/lib/db/prisma";
import type { ParticipantRole } from "@/generated/prisma/client";

export async function getOrCreateChildParentTeacherThread(childId: string, teacherId: string) {
  const child = await prisma.child.findUniqueOrThrow({ where: { id: childId } });

  const existing = await prisma.chatThread.findFirst({
    where: {
      type: "CHILD_PARENT_TEACHER",
      childId,
      participants: { some: { role: "TEACHER", teacherId } },
    },
  });
  if (existing) return existing;

  return prisma.chatThread.create({
    data: {
      type: "CHILD_PARENT_TEACHER",
      childId,
      participants: {
        create: [
          { role: "PARENT", parentId: child.parentId },
          { role: "CHILD", childId },
          { role: "TEACHER", teacherId },
        ],
      },
    },
  });
}

export async function getOrCreatePrivateThread(parentId: string, teacherId: string) {
  const existing = await prisma.chatThread.findFirst({
    where: {
      type: "PARENT_TEACHER_PRIVATE",
      AND: [
        { participants: { some: { role: "PARENT", parentId } } },
        { participants: { some: { role: "TEACHER", teacherId } } },
      ],
    },
  });
  if (existing) return existing;

  return prisma.chatThread.create({
    data: {
      type: "PARENT_TEACHER_PRIVATE",
      participants: {
        create: [
          { role: "PARENT", parentId },
          { role: "TEACHER", teacherId },
        ],
      },
    },
  });
}

export async function isThreadParticipant(
  threadId: string,
  role: ParticipantRole,
  id: string,
): Promise<boolean> {
  const scopedWhere =
    role === "PARENT" ? { parentId: id } : role === "CHILD" ? { childId: id } : { teacherId: id };
  const participant = await prisma.chatThreadParticipant.findFirst({
    where: { threadId, role, ...scopedWhere },
  });
  return !!participant;
}

export async function sendChatMessage(params: {
  threadId: string;
  senderRole: ParticipantRole;
  senderId: string;
  body: string;
}) {
  const message = await prisma.chatMessage.create({
    data: {
      threadId: params.threadId,
      senderRole: params.senderRole,
      senderId: params.senderId,
      body: params.body,
    },
  });

  // Notifie le parent et le prof du même fil dès que l'enfant poste, cf. plan produit.
  if (params.senderRole === "CHILD") {
    const participants = await prisma.chatThreadParticipant.findMany({
      where: { threadId: params.threadId },
    });
    for (const participant of participants) {
      if (participant.role === "PARENT" && participant.parentId) {
        await prisma.notification.create({
          data: {
            parentId: participant.parentId,
            type: "CHAT_MESSAGE",
            payload: { threadId: params.threadId, preview: params.body.slice(0, 100) },
          },
        });
      }
      if (participant.role === "TEACHER" && participant.teacherId) {
        await prisma.notification.create({
          data: {
            teacherId: participant.teacherId,
            type: "CHAT_MESSAGE",
            payload: { threadId: params.threadId, preview: params.body.slice(0, 100) },
          },
        });
      }
    }
  }

  return message;
}

export function listMessages(threadId: string) {
  return prisma.chatMessage.findMany({ where: { threadId }, orderBy: { createdAt: "asc" } });
}

const threadInclude = {
  participants: { include: { teacher: true, parent: true, child: true } },
} as const;

export function listThreadsForChild(childId: string) {
  return prisma.chatThread.findMany({
    where: { participants: { some: { role: "CHILD", childId } } },
    orderBy: { createdAt: "desc" },
    include: threadInclude,
  });
}

export function listThreadsForParent(parentId: string) {
  return prisma.chatThread.findMany({
    where: { participants: { some: { role: "PARENT", parentId } } },
    orderBy: { createdAt: "desc" },
    include: threadInclude,
  });
}

export function listThreadsForTeacher(teacherId: string) {
  return prisma.chatThread.findMany({
    where: { participants: { some: { role: "TEACHER", teacherId } } },
    orderBy: { createdAt: "desc" },
    include: threadInclude,
  });
}
