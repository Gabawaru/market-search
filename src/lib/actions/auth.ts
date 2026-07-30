"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { auth, signIn, signOut } from "@/auth";
import { hashSecret, verifySecret } from "@/lib/auth/password";
import { generateUsername } from "@/lib/auth/username";
import { generateResetToken, hashResetToken, getAppBaseUrl, RESET_TOKEN_TTL_MS } from "@/lib/auth/resetToken";
import { getEmailSender } from "@/lib/notifications";
import {
  parentRegisterSchema,
  teacherApplicationSchema,
  childCreateSchema,
  childLoginSchema,
  childDirectLoginSchema,
  passwordSchema,
  emailSchema,
} from "@/lib/validation/schemas";
import { setChildSessionCookie, clearChildSessionCookie } from "@/lib/auth/childSession";

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function uniqueConstraintTarget(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const target = error.meta?.target;
    if (Array.isArray(target)) return target.join(",");
    if (typeof target === "string") return target;
  }
  return "";
}

// Les emails/identifiants sont stockés normalisés (trim + minuscules) — la connexion doit
// appliquer la même normalisation, sinon une casse différente de celle saisie à l'inscription
// ferait échouer authorize() alors que le mot de passe est correct.
function normalizeEmail(value: FormDataEntryValue | null): string {
  return (value ?? "").toString().trim().toLowerCase();
}

async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await getEmailSender().send({
    to,
    subject: "Réinitialisation de votre mot de passe — Oumno Éducation",
    body: `Vous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur ce lien (valable 1h) pour choisir un nouveau mot de passe :\n${resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.`,
  });
}

// ---------------------------------------------------------------------------
// Parent
// ---------------------------------------------------------------------------

export async function registerParent(formData: FormData) {
  const rawEmail = formData.get("email");
  const rawUsername = formData.get("username");
  const parsed = parentRegisterSchema.safeParse({
    name: formData.get("name"),
    email: rawEmail ? rawEmail : undefined,
    username: rawUsername ? rawUsername : undefined,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect(`/parent/register?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { name, password } = parsed.data;
  const email = parsed.data.email || undefined;
  // Toujours un identifiant, même si l'utilisateur n'en a pas choisi un explicitement
  // (Parent.username est NOT NULL) — dérivé du nom, avec un suffixe aléatoire pour l'unicité.
  const username = parsed.data.username || generateUsername(name);
  const passwordHash = await hashSecret(password);

  try {
    await prisma.parent.create({ data: { name, email, username, passwordHash } });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const target = uniqueConstraintTarget(error);
      const message = target.includes("username")
        ? "Cet identifiant est déjà pris"
        : "Un compte existe déjà avec cet email";
      redirect(`/parent/register?error=${encodeURIComponent(message)}`);
    }
    throw error;
  }

  // Utilise l'identifiant normalisé du schéma de validation, pas la valeur brute du formulaire —
  // sinon la casse d'origine ne correspond plus à ce qui a été stocké.
  try {
    await signIn("credentials", {
      identifier: email ?? username,
      password,
      role: "PARENT",
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/parent/login?error=${encodeURIComponent("Identifiants incorrects")}`);
    }
    throw error;
  }
}

export async function loginParent(formData: FormData) {
  try {
    await signIn("credentials", {
      identifier: normalizeEmail(formData.get("identifier")),
      password: formData.get("password"),
      role: "PARENT",
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/parent/login?error=${encodeURIComponent("Identifiants incorrects")}`);
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

// Toujours la même redirection (succès générique), qu'un compte existe ou non avec l'email
// saisi — révéler la différence permettrait de tester quelles adresses sont enregistrées.
export async function requestParentPasswordReset(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  if (email) {
    const parent = await prisma.parent.findUnique({ where: { email } });
    if (parent) {
      const token = generateResetToken();
      await prisma.passwordResetToken.create({
        data: {
          parentId: parent.id,
          tokenHash: hashResetToken(token),
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });
      try {
        await sendPasswordResetEmail(email, `${getAppBaseUrl()}/parent/reset-password?token=${token}`);
      } catch (error) {
        console.error("[auth] échec envoi email de réinitialisation (parent) :", error);
      }
    }
  }
  redirect("/parent/forgot-password?success=1");
}

export async function resetParentPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const parsed = passwordSchema.safeParse(formData.get("newPassword"));
  if (!parsed.success) {
    redirect(
      `/parent/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(parsed.error.issues[0].message)}`,
    );
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });
  if (!resetToken || !resetToken.parentId || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    redirect(`/parent/reset-password?error=${encodeURIComponent("Ce lien est invalide ou a expiré")}`);
  }

  const passwordHash = await hashSecret(parsed.data);
  await prisma.$transaction([
    prisma.parent.update({ where: { id: resetToken.parentId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  redirect("/parent/login?success=1");
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

export async function changeTeacherEmail(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") {
    redirect("/teacher/login");
  }

  const parsed = emailSchema.safeParse(formData.get("newEmail"));
  if (!parsed.success) {
    redirect(`/teacher/change-email?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: session.user.id } });
  const currentPassword = String(formData.get("currentPassword") ?? "");
  if (!teacher || !(await verifySecret(currentPassword, teacher.passwordHash))) {
    redirect(`/teacher/change-email?error=${encodeURIComponent("Mot de passe actuel incorrect")}`);
  }

  try {
    await prisma.teacher.update({ where: { id: session.user.id }, data: { email: parsed.data } });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirect(`/teacher/change-email?error=${encodeURIComponent("Un compte existe déjà avec cet email")}`);
    }
    throw error;
  }

  redirect("/teacher/dashboard");
}

export async function requestTeacherPasswordReset(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  if (email) {
    const teacher = await prisma.teacher.findUnique({ where: { email } });
    if (teacher) {
      const token = generateResetToken();
      await prisma.passwordResetToken.create({
        data: {
          teacherId: teacher.id,
          tokenHash: hashResetToken(token),
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });
      try {
        await sendPasswordResetEmail(email, `${getAppBaseUrl()}/teacher/reset-password?token=${token}`);
      } catch (error) {
        console.error("[auth] échec envoi email de réinitialisation (prof) :", error);
      }
    }
  }
  redirect("/teacher/forgot-password?success=1");
}

export async function resetTeacherPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const parsed = passwordSchema.safeParse(formData.get("newPassword"));
  if (!parsed.success) {
    redirect(
      `/teacher/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent(parsed.error.issues[0].message)}`,
    );
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });
  if (!resetToken || !resetToken.teacherId || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    redirect(`/teacher/reset-password?error=${encodeURIComponent("Ce lien est invalide ou a expiré")}`);
  }

  const passwordHash = await hashSecret(parsed.data);
  await prisma.$transaction([
    prisma.teacher.update({ where: { id: resetToken.teacherId }, data: { passwordHash, mustChangePassword: false } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  redirect("/teacher/login?success=1");
}

export async function loginTeacher(formData: FormData) {
  try {
    await signIn("credentials", {
      identifier: normalizeEmail(formData.get("identifier")),
      password: formData.get("password"),
      role: "TEACHER",
      redirectTo: "/teacher/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/teacher/login?error=${encodeURIComponent("Identifiants incorrects")}`);
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
      identifier: normalizeEmail(formData.get("email")),
      password: formData.get("password"),
      role: "DEV_ADMIN",
      redirectTo: "/dev/console",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/dev/login?error=${encodeURIComponent("Identifiants incorrects")}`);
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
    gradeLevel: formData.get("gradeLevel"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) {
    redirect(`/dashboard/children/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { name, birthYear, gradeLevel, pin } = parsed.data;
  const pinHash = await hashSecret(pin);

  await prisma.child.create({
    data: { parentId: session.user.id, name, birthYear, gradeLevel, pinHash },
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

// Connexion directe par prénom + code PIN, sans qu'un parent soit déjà connecté sur l'appareil
// (contrairement à loginChild ci-dessus, qui exige une session PARENT active). Le prénom n'est
// pas unique à l'échelle du site (seulement au sein d'un même parent) : on recherche parmi tous
// les enfants portant ce prénom et on vérifie le PIN de chacun jusqu'à trouver une correspondance.
export async function loginChildByNamePin(formData: FormData) {
  const parsed = childDirectLoginSchema.safeParse({
    name: formData.get("name"),
    pin: formData.get("pin"),
  });
  if (!parsed.success) {
    redirect(`/child/login?error=${encodeURIComponent("Prénom ou code PIN incorrect")}`);
  }

  const { name, pin } = parsed.data;
  const candidates = await prisma.child.findMany({
    where: { name: { equals: name, mode: "insensitive" } },
  });

  for (const candidate of candidates) {
    if (await verifySecret(pin, candidate.pinHash)) {
      await setChildSessionCookie({
        childId: candidate.id,
        parentId: candidate.parentId,
        name: candidate.name,
      });
      redirect("/app");
    }
  }

  // Message générique (ne précise pas si le prénom existe) pour ne pas faciliter une attaque
  // par force brute sur le code PIN d'un prénom connu.
  redirect(`/child/login?error=${encodeURIComponent("Prénom ou code PIN incorrect")}`);
}

export async function logoutChild() {
  await clearChildSessionCookie();
  redirect("/child/select-profile");
}
