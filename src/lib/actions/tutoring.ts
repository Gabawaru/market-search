"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getOrCreateChildParentTeacherThread } from "@/lib/messaging/threads";
import { decideTutoringPayout } from "@/lib/tutoring/payoutDecision";

const DEFAULT_PERIOD_DAYS = 30;

function getString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function createTutoringRequest(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "PARENT") redirect("/parent/login");

  const childId = getString(formData, "childId");
  const teacherId = getString(formData, "teacherId");
  const targetLevelId = getString(formData, "targetLevelId");
  const targetScoreRaw = getString(formData, "targetScore");
  const proposedRateRaw = getString(formData, "proposedRate");
  if (!childId || !teacherId || !targetLevelId || !targetScoreRaw || !proposedRateRaw) {
    redirect(`/dashboard/${childId ?? ""}/tutoring`);
  }

  const child = await prisma.child.findFirst({ where: { id: childId, parentId: session.user.id } });
  if (!child) redirect("/dashboard");

  await prisma.tutoringRequest.create({
    data: {
      parentId: session.user.id,
      childId,
      teacherId,
      targetLevelId,
      targetScore: Number(targetScoreRaw) / 100,
      proposedRate: Number(proposedRateRaw),
    },
  });

  redirect(`/dashboard/${childId}/tutoring`);
}

export async function respondTutoringRequest(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const requestId = getString(formData, "requestId");
  const decision = getString(formData, "decision");
  if (!requestId || !decision) redirect("/teacher/dashboard/tutoring");

  const request = await prisma.tutoringRequest.findFirst({
    where: { id: requestId, teacherId: session.user.id, status: "PENDING" },
  });
  if (!request) redirect("/teacher/dashboard/tutoring");

  if (decision === "decline") {
    await prisma.tutoringRequest.update({ where: { id: requestId }, data: { status: "DECLINED" } });
    redirect("/teacher/dashboard/tutoring");
  }

  const periodStart = new Date();
  const periodEnd = new Date(periodStart.getTime() + DEFAULT_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  await prisma.tutoringRequest.update({
    where: { id: requestId },
    data: { status: "ACTIVE", periodStart, periodEnd },
  });

  // Le suivi mérite une discussion partagée : on ouvre (ou réutilise) le fil enfant/parent/prof.
  await getOrCreateChildParentTeacherThread(request.childId, request.teacherId);

  redirect(`/teacher/dashboard/tutoring/${requestId}`);
}

const MIN_WEEKDAY = 0;
const MAX_WEEKDAY = 6;

export async function addTeacherAvailability(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const weekdayRaw = getString(formData, "weekday");
  const startTime = getString(formData, "startTime");
  const endTime = getString(formData, "endTime");
  if (!weekdayRaw || !startTime || !endTime) {
    redirect("/teacher/dashboard/availability");
  }

  const weekday = Number(weekdayRaw);
  if (!Number.isInteger(weekday) || weekday < MIN_WEEKDAY || weekday > MAX_WEEKDAY || startTime >= endTime) {
    redirect("/teacher/dashboard/availability");
  }

  await prisma.teacherAvailability.create({
    data: { teacherId: session.user.id, weekday, startTime, endTime },
  });

  redirect("/teacher/dashboard/availability");
}

export async function removeTeacherAvailability(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") redirect("/teacher/login");

  const id = getString(formData, "id");
  if (!id) redirect("/teacher/dashboard/availability");

  await prisma.teacherAvailability.deleteMany({ where: { id, teacherId: session.user.id } });

  redirect("/teacher/dashboard/availability");
}

export async function closeTutoringPeriod(formData: FormData) {
  const session = await auth();
  const requestId = getString(formData, "requestId");
  if (!requestId) redirect("/dashboard");

  const request = await prisma.tutoringRequest.findUniqueOrThrow({ where: { id: requestId } });
  const isOwnerParent = session?.user.role === "PARENT" && session.user.id === request.parentId;
  const isOwnerTeacher = session?.user.role === "TEACHER" && session.user.id === request.teacherId;
  if (!isOwnerParent && !isOwnerTeacher) {
    redirect("/dashboard");
  }

  await decideTutoringPayout(requestId);
  await prisma.tutoringRequest.update({ where: { id: requestId }, data: { status: "ENDED" } });

  redirect(
    isOwnerParent
      ? `/dashboard/${request.childId}/tutoring/${requestId}`
      : `/teacher/dashboard/tutoring/${requestId}`,
  );
}
