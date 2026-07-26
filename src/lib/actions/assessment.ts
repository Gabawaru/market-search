"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { generateChildAssessment } from "@/lib/assessment/childAssessment";

export async function generateWeeklyAssessment(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }

  const childId = formData.get("childId");
  if (typeof childId !== "string") {
    redirect("/dashboard");
  }

  const child = await prisma.child.findFirst({ where: { id: childId, parentId: session.user.id } });
  if (!child) {
    redirect("/dashboard");
  }

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  await generateChildAssessment(childId, periodStart, periodEnd, "manual");

  redirect(`/dashboard/${childId}/reports`);
}
