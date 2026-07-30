import "dotenv/config";
import { randomBytes } from "node:crypto";
import { prisma } from "../src/lib/db/prisma";
import { hashSecret } from "../src/lib/auth/password";

function generatePassword(): string {
  return randomBytes(9).toString("base64url");
}

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const COMBINING_DIACRITICS = /[\u0300-\u036f]/g;

// Duplique lib/actions/auth.ts::generateUsername — ce script tourne en tsx standalone (build
// Vercel), pas dans le bundle Next.js, donc autant garder sa propre copie plutôt que dépendre
// d'un chemin d'import qui pourrait ne pas se résoudre pareil hors de l'app.
function generateUsername(base: string): string {
  const slug =
    base
      .toLowerCase()
      .normalize("NFD")
      .replace(COMBINING_DIACRITICS, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 20) || "compte";
  return `${slug}-${randomBytes(3).toString("hex")}`;
}

// Idempotent par conception : ce script tourne à chaque build (Vercel n'a pas besoin d'un accès
// direct que je n'ai pas depuis mon environnement de travail pour l'exécuter séparément). Il ne
// régénère jamais un mot de passe/PIN déjà en place — sinon les identifiants déjà communiqués au
// parent deviendraient invalides à chaque nouveau déploiement.
const PARENT_DISPLAY_NAME = "Bory";

async function main() {
  const parentEmail = process.env.DEMO_PARENT_EMAIL ?? "gabriel.carb.pro@gmail.com";
  let parent = await prisma.parent.findUnique({ where: { email: parentEmail } });
  if (parent) {
    // Le mot de passe existant n'est jamais touché ici — seul le nom affiché peut changer
    // (demande de Gabriel de renommer ce compte parent).
    if (parent.name !== PARENT_DISPLAY_NAME) {
      parent = await prisma.parent.update({
        where: { id: parent.id },
        data: { name: PARENT_DISPLAY_NAME },
      });
      console.log(`Parent   : ${parentEmail} renommé en "${PARENT_DISPLAY_NAME}" (mot de passe inchangé)`);
    } else {
      console.log(`Parent   : ${parentEmail} (déjà configuré, mot de passe inchangé)`);
    }
  } else {
    const parentPassword = generatePassword();
    parent = await prisma.parent.create({
      data: {
        email: parentEmail,
        name: PARENT_DISPLAY_NAME,
        username: generateUsername(PARENT_DISPLAY_NAME),
        passwordHash: await hashSecret(parentPassword),
      },
    });
    console.log(`Parent   : ${parentEmail} / ${parentPassword}`);
  }

  const teacherEmail = "prof.demo@oumno-education.fr";
  const existingTeacher = await prisma.teacher.findUnique({ where: { email: teacherEmail } });
  if (existingTeacher) {
    console.log(`Prof     : ${teacherEmail} (déjà configuré, mot de passe inchangé)`);
  } else {
    const teacherPassword = generatePassword();
    await prisma.teacher.create({
      data: {
        email: teacherEmail,
        name: "Prof Démo",
        username: generateUsername("Prof Démo"),
        passwordHash: await hashSecret(teacherPassword),
        verified: true,
        bio: "Compte prof de démonstration.",
        ratePerSession: 20,
      },
    });
    console.log(`Prof     : ${teacherEmail} / ${teacherPassword}`);
  }

  // Second compte prof réel (même adresse que le compte parent) : mot de passe fixe demandé
  // explicitement par Gabriel, pas généré aléatoirement comme le reste de ce script.
  const existingSecondTeacher = await prisma.teacher.findUnique({ where: { email: parentEmail } });
  if (existingSecondTeacher) {
    console.log(`Prof     : ${parentEmail} (déjà configuré, mot de passe inchangé)`);
  } else {
    const fixedTeacherPassword = "12345678";
    await prisma.teacher.create({
      data: {
        email: parentEmail,
        name: "Gabriel",
        username: generateUsername("Gabriel"),
        passwordHash: await hashSecret(fixedTeacherPassword),
        verified: true,
        bio: "Compte prof.",
        ratePerSession: 20,
      },
    });
    console.log(`Prof     : ${parentEmail} / ${fixedTeacherPassword}`);
  }

  let existingChildren = await prisma.child.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "asc" },
  });

  // Corrige l'orthographe d'un enfant déjà créé (garde le même PIN, ne recrée pas un doublon).
  const childRenames: Record<string, string> = { Jérémy: "Jérémie" };
  for (const [oldName, newName] of Object.entries(childRenames)) {
    const toRename = existingChildren.find((c) => c.name === oldName);
    const alreadyRenamed = existingChildren.some((c) => c.name === newName);
    if (toRename && !alreadyRenamed) {
      await prisma.child.update({ where: { id: toRename.id }, data: { name: newName } });
      console.log(`Enfant   : ${oldName} renommé en "${newName}" (PIN inchangé)`);
      existingChildren = existingChildren.map((c) => (c.id === toRename.id ? { ...c, name: newName } : c));
    }
  }

  const childSpecs = [
    { name: "Lina", birthYear: new Date().getFullYear() - 8, gradeLevel: "CE2" },
    { name: "Yanis", birthYear: new Date().getFullYear() - 10, gradeLevel: "CM2" },
    { name: "Jérémie", birthYear: new Date().getFullYear() - 9, gradeLevel: "CM1" },
    { name: "Nathan", birthYear: new Date().getFullYear() - 11, gradeLevel: "6e" },
  ];

  for (const spec of childSpecs) {
    const existing = existingChildren.find((c) => c.name === spec.name);
    if (existing) {
      console.log(`Enfant   : ${spec.name} (déjà configuré, PIN inchangé)`);
      continue;
    }
    const pin = generatePin();
    await prisma.child.create({
      data: {
        parentId: parent.id,
        name: spec.name,
        birthYear: spec.birthYear,
        gradeLevel: spec.gradeLevel,
        pinHash: await hashSecret(pin),
      },
    });
    console.log(`Enfant   : ${spec.name} — PIN ${pin} (via la sélection de profil du compte parent ci-dessus)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
