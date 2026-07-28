"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { auth, signIn, signOut } from "@/auth";
import { hashSecret, verifySecret } from "@/lib/auth/password";
import {
  parentRegisterSchema,
  teacherApplicationSchema,
  childCreateSchema,
  childLoginSchema,
  passwordSchema,
  emailSchema,
} from "@/lib/validation/schemas";
import { setChildSessionCookie, clearChildSessionCookie } from "@/lib/auth/childSession";

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// Les emails sont stockés normalisés (trim + minuscules, cf. emailSchema) — la connexion
// doit appliquer la même normalisation, sinon une casse différente de celle saisie à
// l'inscription ferait échouer authorize() alors que le mot de passe est correct.
function normalizeEmail(value: FormDataEntryValue | null): string {
  return (value ?? "").toString().trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Parent
// ---------------------------------------------------------------------------

export async function registerParent(formData: FormData) {
  const parsed = parentRegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect(`/parent/register?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await hashSecret(password);

  try {
    await prisma.parent.create({ data: { name, email, passwordHash } });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirect(`/parent/register?error=${encodeURIComponent("Un compte existe déjà avec cet email")}`);
    }
    throw error;
  }

  // Utilise l'email normalisé (trim + minuscules) du schéma de validation, pas la valeur
  // brute du formulaire — sinon la casse d'origine ne correspond plus à ce qui a été stocké.
  try {
    await signIn("credentials", { email, password, role: "PARENT", redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/parent/login?error=${encodeURIComponent("Email ou mot de passe incorrect")}`);
    }
    throw error;
  }
}

export async function loginParent(formData: FormData) {
  try {
    await signIn("credentials", {
      email: normalizeEmail(formData.get("email")),
      password: formData.get("password"),
      role: "PARENT",
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/parent/login?error=${encodeURIComponent("Email ou mot de passe incorrect")}`);
    }
    throw error;
  }
}

export async function logoutParent() {
  await signOut({ redirectTo: "/" });
}

export async function changeParentPassword(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }

  const parsed = passwordSchema.safeParse(formData.get("newPassword"));
  if (!parsed.success) {
    redirect(`/dashboard/change-password?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const parent = await prisma.parent.findUnique({ where: { id: session.user.id } });
  const currentPassword = String(formData.get("currentPassword") ?? "");
  if (!parent || !(await verifySecret(currentPassword, parent.passwordHash))) {
    redirect(`/dashboard/change-password?error=${encodeURIComponent("Mot de passe actuel incorrect")}`);
  }

  const passwordHash = await hashSecret(parsed.data);
  await prisma.parent.update({ where: { id: session.user.id }, data: { passwordHash } });

  redirect("/dashboard");
}

export async function changeParentEmail(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }

  const parsed = emailSchema.safeParse(formData.get("newEmail"));
  if (!parsed.success) {
    redirect(`/dashboard/change-email?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const parent = await prisma.parent.findUnique({ where: { id: session.user.id } });
  const currentPassword = String(formData.get("currentPassword") ?? "");
  if (!parent || !(await verifySecret(currentPassword, parent.passwordHash))) {
    redirect(`/dashboard/change-email?error=${encodeURIComponent("Mot de passe actuel incorrect")}`);
  }

  try {
    await prisma.parent.update({ where: { id: session.user.id }, data: { email: parsed.data } });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirect(`/dashboard/change-email?error=${encodeURIComponent("Un compte existe déjà avec cet email")}`);
    }
    throw error;
  }

  redirect("/dashboard");
}

// ---------------------------------------------------------------------------
// Teacher
// ---------------------------------------------------------------------------

// Un prof ne peut plus créer son compte directement : il envoie une candidature, qui doit
// être validée depuis l'espace développeur avant qu'un compte (avec identifiants temporaires)
// n'existe. Voir approveTeacherApplication dans lib/actions/devConsole.ts.
export async function applyAsTeacher(formData: FormData) {
  const parsed = teacherApplicationSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) {
    redirect(`/teacher/apply?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  try {
    await prisma.teacherApplication.create({ data: parsed.data });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirect(
        `/teacher/apply?error=${encodeURIComponent("Une candidature existe déjà avec cet email")}`,
      );
    }
    throw error;
  }

  redirect("/teacher/apply?success=1");
}

export async function changeTeacherPassword(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") {
    redirect("/teacher/login");
  }

  const parsed = passwordSchema.safeParse(formData.get("newPassword"));
  if (!parsed.success) {
    redirect(`/teacher/change-password?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: session.user.id } });
  const currentPassword = String(formData.get("currentPassword") ?? "");
  if (!teacher || !(await verifySecret(currentPassword, teacher.passwordHash))) {
    redirect(`/teacher/change-password?error=${encodeURIComponent("Mot de passe actuel incorrect")}`);
  }

  const passwordHash = await hashSecret(parsed.data);
  await prisma.teacher.update({
    where: { id: session.user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  redirect("/teacher/dashboard");
}

export async function loginTeacher(formData: FormData) {
  try {
    await signIn("credentials", {
      email: normalizeEmail(formData.get("email")),
      password: formData.get("password"),
      role: "TEACHER",
      redirectTo: "/teacher/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/teacher/login?error=${encodeURIComponent("Email ou mot de passe incorrect")}`);
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Dev admin (pas d'inscription publique — compte provisionné via script/seed)
// ---------------------------------------------------------------------------

export async function loginDevAdmin(formData: FormData) {
  try {
    await signIn("credentials", {
      email: normalizeEmail(formData.get("email")),
      password: formData.get("password"),
      role: "DEV_ADMIN",
      redirectTo: "/dev/console",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/dev/login?error=${encodeURIComponent("Email ou mot de passe incorrect")}`);
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Enfant (profil + PIN, rattaché au parent connecté)
// ---------------------------------------------------------------------------

export async function createChildProfile(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }

  const parsed = childCreateSchema.safeParse({
    name: formData.get("name"),
    birthYear: formData.get("birthYear"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) {
    redirect(`/dashboard/children/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { name, birthYear, pin } = parsed.data;
  const pinHash = await hashSecret(pin);

  await prisma.child.create({
    data: { parentId: session.user.id, name, birthYear, pinHash },
  });

  redirect("/dashboard");
}

export async function loginChild(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "PARENT") {
    redirect("/parent/login");
  }

  const parsed = childLoginSchema.safeParse({
    childId: formData.get("childId"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) {
    redirect(`/child/select-profile?error=${encodeURIComponent("PIN invalide")}`);
  }

  const { childId, pin } = parsed.data;
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: session.user.id },
  });
  if (!child) {
    redirect(`/child/select-profile?error=${encodeURIComponent("Profil introuvable")}`);
  }

  const valid = await verifySecret(pin, child.pinHash);
  if (!valid) {
    redirect(`/child/pin?childId=${childId}&error=${encodeURIComponent("Code PIN incorrect")}`);
  }

  await setChildSessionCookie({ childId: child.id, parentId: child.parentId, name: child.name });
  redirect("/app");
}

export async function logoutChild() {
  await clearChildSessionCookie();
  redirect("/child/select-profile");
}
