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

async function main() {
  const parentEmail = process.env.DEMO_PARENT_EMAIL ?? "gabriel.carb.pro@gmail.com";
  const parentPassword = generatePassword();
  const parent = await prisma.parent.upsert({
    where: { email: parentEmail },
    update: { passwordHash: await hashSecret(parentPassword), name: "Gabriel" },
    create: {
      email: parentEmail,
      name: "Gabriel",
      passwordHash: await hashSecret(parentPassword),
    },
  });

  const teacherEmail = "prof.demo@oumno-education.fr";
  const teacherPassword = generatePassword();
  const teacher = await prisma.teacher.upsert({
    where: { email: teacherEmail },
    update: {
      passwordHash: await hashSecret(teacherPassword),
      name: "Prof Démo",
      verified: true,
      mustChangePassword: false,
    },
    create: {
      email: teacherEmail,
      name: "Prof Démo",
      passwordHash: await hashSecret(teacherPassword),
      verified: true,
      bio: "Compte prof de démonstration.",
      ratePerSession: 20,
    },
  });

  const existingChildren = await prisma.child.findMany({
    where: { parentId: parent.id },
    orderBy: { createdAt: "asc" },
  });

  const childSpecs = [
    { name: "Lina", birthYear: new Date().getFullYear() - 8 },
    { name: "Yanis", birthYear: new Date().getFullYear() - 10 },
  ];

  const children: { name: string; pin: string }[] = [];
  for (let i = 0; i < childSpecs.length; i++) {
    const spec = childSpecs[i];
    const pin = generatePin();
    const existing = existingChildren.find((c) => c.name === spec.name);
    if (existing) {
      await prisma.child.update({
        where: { id: existing.id },
        data: { pinHash: await hashSecret(pin), birthYear: spec.birthYear },
      });
    } else {
      await prisma.child.create({
        data: {
          parentId: parent.id,
          name: spec.name,
          birthYear: spec.birthYear,
          pinHash: await hashSecret(pin),
        },
      });
    }
    children.push({ name: spec.name, pin });
  }

  console.log("=== Comptes de démo Oumno Éducation ===");
  console.log(`Parent   : ${parentEmail} / ${parentPassword}`);
  console.log(`Prof     : ${teacherEmail} / ${teacherPassword}`);
  for (const child of children) {
    console.log(`Enfant   : ${child.name} — PIN ${child.pin} (via la sélection de profil du compte parent ci-dessus)`);
  }
  console.log(`Teacher record id: ${teacher.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
