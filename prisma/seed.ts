import "dotenv/config";
import { prisma } from "../src/lib/db/prisma";
import { hashSecret } from "../src/lib/auth/password";

async function seedDevAdmin() {
  const email = process.env.DEV_ADMIN_EMAIL;
  const password = process.env.DEV_ADMIN_PASSWORD;
  const name = process.env.DEV_ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    console.log(
      "DEV_ADMIN_EMAIL / DEV_ADMIN_PASSWORD non définis — aucun compte développeur créé. " +
        "Définis-les temporairement dans l'environnement puis relance `npm run db:seed` pour en créer un.",
    );
    return;
  }

  const passwordHash = await hashSecret(password);
  await prisma.devAdmin.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
  });
  console.log(`Compte développeur prêt pour ${email}`);
}

async function main() {
  await seedDevAdmin();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
