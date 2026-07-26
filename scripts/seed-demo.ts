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

// Idempotent par conception : ce script tourne à chaque build (Vercel n'a pas besoin d'un accès
// direct que je n'ai pas depuis mon environnement de travail pour l'exécuter séparément). Il ne
// régénère jamais un mot de passe/PIN déjà en place — sinon les identifiants déjà communiqués au
// parent deviendraient invalides à chaque nouveau déploiement.
async function main() {
  const parentEmail = process.env.DEMO_PARENT_EMAIL ?? "gabriel.carb.pro@gmail.com";
  let parent = await prisma.parent.findUnique({ where: { email: parentEmail } });
  if (parent) {
    console.log(`Parent   : ${parentEmail} (déjà configuré, mot de passe inchangé)`);
  } else {
    const parentPassword = generatePassword();
    parent = await prisma.parent.create({
      data: { email: parentEmail, name: "Gabriel", passwordHash: await hashSecret(parentPassword) },
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
        passwordHash: await hashSecret(teacherPassword),
        verified: true,
        bio: "Compte prof de démonstration.",
        ratePerSession: 20,
      },
    });
    console.log(`Prof     : ${teacherEmail} / ${teacherPassword}`);
  }

  const existingChildren = await prisma.child.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "asc" },
  });

  const childSpecs = [
    { name: "Lina", birthYear: new Date().getFullYear() - 8 },
    { name: "Yanis", birthYear: new Date().getFullYear() - 10 },
  ];

  for (const spec of childSpecs) {
    const existing = existingChildren.find((c) => c.name === spec.name);
    if (existing) {
      console.log(`Enfant   : ${spec.name} (déjà configuré, PIN inchangé)`);
      continue;
    }
    const pin = generatePin();
    await prisma.child.create({
      data: { parentId: parent.id, name: spec.name, birthYear: spec.birthYear, pinHash: await hashSecret(pin) },
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
