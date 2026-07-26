"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

async function requireDevAdmin() {
  const session = await auth();
  if (session?.user.role !== "DEV_ADMIN") {
    redirect("/dev/login");
  }
  return session;
}

export async function approveDevSuggestion(formData: FormData) {
  await requireDevAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") redirect("/dev/console");

  await prisma.devSuggestion.update({
    where: { id },
    data: { status: "APPROVED", reviewedAt: new Date() },
  });
  redirect("/dev/console");
}

export async function rejectDevSuggestion(formData: FormData) {
  await requireDevAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") redirect("/dev/console");

  await prisma.devSuggestion.update({
    where: { id },
    data: { status: "REJECTED", reviewedAt: new Date() },
  });
  redirect("/dev/console");
}
