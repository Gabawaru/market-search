"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { hashSecret } from "@/lib/auth/password";

async function requireDevAdmin() {
  const session = await auth();
  if (session?.user.role !== "DEV_ADMIN") {
    redirect("/dev/login");
  }
  return session;
}

function generateTemporaryPassword(): string {
  // Lisible pour être relayé oralement/par écrit au prof, mais assez long pour rester sûr —
  // il doit de toute façon être changé dès la première connexion (mustChangePassword).
  return randomBytes(9).toString("base64url");
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

// ---------------------------------------------------------------------------
// Candidatures profs
// ---------------------------------------------------------------------------

export async function approveTeacherApplication(formData: FormData) {
  await requireDevAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") redirect("/dev/console");

  const application = await prisma.teacherApplication.findUnique({ where: { id } });
  if (!application || application.status !== "PENDING") redirect("/dev/console");

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashSecret(temporaryPassword);

  await prisma.$transaction([
    prisma.teacher.create({
      data: {
        name: application.name,
        email: application.email,
        passwordHash,
        mustChangePassword: true,
      },
    }),
    prisma.teacherApplication.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    }),
  ]);

  // Le mot de passe temporaire n'est affiché qu'une seule fois (il n'est jamais stocké en
  // clair) — à relayer immédiatement et de façon sécurisée au prof, qui devra le changer dès
  // sa première connexion.
  redirect(
    `/dev/console?tempPasswordEmail=${encodeURIComponent(application.email)}&tempPassword=${encodeURIComponent(temporaryPassword)}`,
  );
}

export async function rejectTeacherApplication(formData: FormData) {
  await requireDevAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") redirect("/dev/console");

  await prisma.teacherApplication.update({
    where: { id },
    data: { status: "REJECTED", reviewedAt: new Date() },
  });
  redirect("/dev/console");
}
