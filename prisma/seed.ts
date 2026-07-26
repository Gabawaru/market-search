import "dotenv/config";
import { prisma } from "../src/lib/db/prisma";
import { hashSecret } from "../src/lib/auth/password";
import { ExerciseType, type Prisma } from "../src/generated/prisma/client";

interface SeedExercise {
  generatorKey: string;
  type: ExerciseType;
  paramsSchema: Prisma.InputJsonObject;
}

interface SeedLevel {
  order: number;
  name: string;
  exercises: SeedExercise[];
}

interface SeedSkill {
  code: string;
  name: string;
  order: number;
  minAge: number;
  levels: SeedLevel[];
}

const MATH_CURRICULUM: SeedSkill[] = [
  {
    code: "numeration",
    name: "Numération",
    order: 1,
    minAge: 5,
    levels: [
      {
        order: 1,
        name: "Nombres jusqu'à 20",
        exercises: [
          { generatorKey: "numeration-successor", type: ExerciseType.NUMERIC, paramsSchema: { min: 0, max: 20 } },
          { generatorKey: "numeration-predecessor", type: ExerciseType.NUMERIC, paramsSchema: { min: 1, max: 20 } },
        ],
      },
      {
        order: 2,
        name: "Nombres jusqu'à 100",
        exercises: [
          { generatorKey: "numeration-successor", type: ExerciseType.NUMERIC, paramsSchema: { min: 0, max: 100 } },
          { generatorKey: "numeration-compare", type: ExerciseType.NUMERIC, paramsSchema: { min: 0, max: 100 } },
        ],
      },
    ],
  },
  {
    code: "addition",
    name: "Addition",
    order: 2,
    minAge: 6,
    levels: [
      {
        order: 1,
        name: "Additions simples (jusqu'à 10)",
        exercises: [
          { generatorKey: "addition-basic", type: ExerciseType.NUMERIC, paramsSchema: { min: 1, max: 10 } },
        ],
      },
      {
        order: 2,
        name: "Additions à deux chiffres",
        exercises: [
          { generatorKey: "addition-basic", type: ExerciseType.NUMERIC, paramsSchema: { min: 10, max: 99 } },
        ],
      },
    ],
  },
  {
    code: "soustraction",
    name: "Soustraction",
    order: 3,
    minAge: 6,
    levels: [
      {
        order: 1,
        name: "Soustractions simples",
        exercises: [
          { generatorKey: "subtraction-basic", type: ExerciseType.NUMERIC, paramsSchema: { min: 1, max: 20 } },
        ],
      },
      {
        order: 2,
        name: "Soustractions à deux chiffres",
        exercises: [
          { generatorKey: "subtraction-basic", type: ExerciseType.NUMERIC, paramsSchema: { min: 10, max: 99 } },
        ],
      },
    ],
  },
  {
    code: "multiplication",
    name: "Multiplication",
    order: 4,
    minAge: 8,
    levels: [
      {
        order: 1,
        name: "Tables jusqu'à 5",
        exercises: [
          { generatorKey: "multiplication-table", type: ExerciseType.NUMERIC, paramsSchema: { maxFactor: 5 } },
        ],
      },
      {
        order: 2,
        name: "Tables jusqu'à 10",
        exercises: [
          { generatorKey: "multiplication-table", type: ExerciseType.NUMERIC, paramsSchema: { maxFactor: 10 } },
        ],
      },
    ],
  },
  {
    code: "division",
    name: "Division",
    order: 5,
    minAge: 9,
    levels: [
      {
        order: 1,
        name: "Divisions exactes simples",
        exercises: [
          {
            generatorKey: "division-exact",
            type: ExerciseType.NUMERIC,
            paramsSchema: { maxDivisor: 5, maxQuotient: 10 },
          },
        ],
      },
      {
        order: 2,
        name: "Divisions exactes avancées",
        exercises: [
          {
            generatorKey: "division-exact",
            type: ExerciseType.NUMERIC,
            paramsSchema: { maxDivisor: 10, maxQuotient: 12 },
          },
        ],
      },
    ],
  },
  {
    code: "fractions",
    name: "Fractions",
    order: 6,
    minAge: 10,
    levels: [
      {
        order: 1,
        name: "Simplifier des fractions",
        exercises: [
          {
            generatorKey: "fraction-simplify",
            type: ExerciseType.NUMERIC,
            paramsSchema: { maxDenominator: 12 },
          },
        ],
      },
    ],
  },
];

async function seedMathCurriculum() {
  const subject = await prisma.subject.upsert({
    where: { code: "MATH" },
    update: { name: "Mathématiques" },
    create: { code: "MATH", name: "Mathématiques" },
  });

  for (const skillData of MATH_CURRICULUM) {
    const skill = await prisma.skill.upsert({
      where: { code: skillData.code },
      update: {
        name: skillData.name,
        order: skillData.order,
        minAge: skillData.minAge,
        subjectId: subject.id,
      },
      create: {
        code: skillData.code,
        name: skillData.name,
        order: skillData.order,
        minAge: skillData.minAge,
        subjectId: subject.id,
      },
    });

    for (const levelData of skillData.levels) {
      const level = await prisma.level.upsert({
        where: { skillId_order: { skillId: skill.id, order: levelData.order } },
        update: { name: levelData.name },
        create: { skillId: skill.id, order: levelData.order, name: levelData.name },
      });

      const existingExercises = await prisma.exercise.count({ where: { levelId: level.id } });
      if (existingExercises === 0) {
        for (const ex of levelData.exercises) {
          await prisma.exercise.create({
            data: {
              levelId: level.id,
              type: ex.type,
              generatorKey: ex.generatorKey,
              paramsSchema: ex.paramsSchema,
            },
          });
        }
      }
    }
  }

  console.log("Curriculum de maths (seed) prêt.");
}

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
  await seedMathCurriculum();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
