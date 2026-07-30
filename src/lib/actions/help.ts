"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { HELP_REQUEST_NOTIFICATION_TYPE, createHelpRequest } from "@/lib/progression/helpRequests";

function getString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function requestHelpFromParent(formData: FormData) {
  const session = await getChildSession();
  if (!session) redirect("/child/select-profile");

  const skillId = getString(formData, "skillId");
  if (!skillId) redirect("/app/practice");

  // Le parent destinataire est relu depuis la base : le jeton de session enfant ne sert qu'à
  // identifier l'enfant, jamais à décider qui reçoit la notification.
  const child = await prisma.child.findUniqueOrThrow({ where: { id: session.childId } });
  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) redirect("/app/practice");

  await createHelpRequest({
    parentId: child.parentId,
    childId: child.id,
    skillId: skill.id,
    skillName: skill.name,
  });

  redirect(`/app/practice/${skill.id}`);
}

export async function dismissHelpRequest(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "PARENT") redirect("/parent/login");

  const notificationId = getString(formData, "notificationId");
  const childId = getString(formData, "childId");
  if (!notificationId || !childId) redirect("/dashboard");

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      parentId: session.user.id,
      type: HELP_REQUEST_NOTIFICATION_TYPE,
    },
    data: { readAt: new Date() },
  });

  redirect(`/dashboard/${childId}`);
}
