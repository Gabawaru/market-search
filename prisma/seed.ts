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

const BADGES: { code: string; label: string; description: string; icon: string }[] = [
  {
    code: "first_evaluation_passed",
    label: "Premier niveau validé",
    description: "Tu as réussi ta première évaluation !",
    icon: "🏆",
  },
  {
    code: "streak_7",
    label: "Une semaine d'assiduité",
    description: "7 jours d'affilée à t'entraîner.",
    icon: "🔥",
  },
  {
    code: "streak_30",
    label: "Un mois d'assiduité",
    description: "30 jours d'affilée à t'entraîner !",
    icon: "🔥",
  },
  {
    code: "hundred_exercises",
    label: "100 exercices",
    description: "Tu as réalisé 100 exercices d'entraînement.",
    icon: "💯",
  },
];

async function seedBadges() {
  for (const badge of BADGES) {
    await prisma.badge.upsert({ where: { code: badge.code }, update: badge, create: badge });
  }
  console.log("Badges (seed) prêts.");
}

const REWARD_CATALOG: {
  code: string;
  label: string;
  description: string;
  cost: number;
  icon: string;
  kind: "COSMETIC" | "STREAK_FREEZE";
}[] = [
  {
    code: "pause_day",
    label: "Jour de pause",
    description: "Un jour de pause qui ne casse pas ta série — utilisé automatiquement si tu manques un jour.",
    // Volontairement coûteux (5x le prix initial) : un jour de pause doit rester une vraie
    // récompense pour un effort soutenu, pas un filet de sécurité bon marché qui permettrait
    // d'accumuler des séries sans pratiquer réellement.
    cost: 500,
    icon: "🌴",
    kind: "STREAK_FREEZE",
  },
  {
    code: "avatar_star",
    label: "Étoile spéciale",
    description: "Une étoile qui brille sur ton profil.",
    cost: 50,
    icon: "⭐",
    kind: "COSMETIC",
  },
  {
    code: "color_theme",
    label: "Thème coloré",
    description: "Débloque un thème de couleurs pour ton espace.",
    cost: 75,
    icon: "🎨",
    kind: "COSMETIC",
  },
];

async function seedRewardCatalog() {
  for (const item of REWARD_CATALOG) {
    await prisma.rewardCatalogItem.upsert({
      where: { code: item.code },
      update: item,
      create: item,
    });
  }
  console.log("Catalogue de récompenses (seed) prêt.");
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

// Premier lot d'exercices collège sourcés sur le programme officiel (attendus de fin d'année de
// 6e, Éduscol / Ministère de l'Éducation nationale, sous Licence Ouverte / Etalab 2.0 qui autorise
// la réutilisation et l'adaptation avec attribution). Les énoncés sont RÉÉCRITS de façon originale
// (jamais copiés d'un contenu tiers), et alignés sur des attendus non protégeables (le programme
// scolaire). Réponses toujours déterministes (numérique/fraction, vérifiées par answersMatch).
// Insérés en statut PENDING : rien n'est visible pour un enfant sans validation dans /dev/console.
const CURATED_SOURCE_URL =
  "https://eduscol.education.gouv.fr/sites/default/files/document/12-maths-6e-attendus-eduscol1114742pdf-74661.pdf";
const CURATED_SOURCE_LICENSE =
  "Licence Ouverte / Etalab 2.0 — attendus officiels de 6e, Éduscol (Éducation nationale)";

const CURATED_EXERCISES: {
  skillCode: string;
  levelOrder: number;
  gradeLevel: string;
  promptText: string;
  correctAnswer: string;
}[] = [
  { skillCode: "fractions", levelOrder: 1, gradeLevel: "6e", promptText: "Simplifie la fraction 6/8 et écris-la sous forme irréductible (par exemple : a/b).", correctAnswer: "3/4" },
  { skillCode: "fractions", levelOrder: 1, gradeLevel: "6e", promptText: "Simplifie la fraction 10/15 sous forme irréductible.", correctAnswer: "2/3" },
  { skillCode: "fractions", levelOrder: 1, gradeLevel: "6e", promptText: "Simplifie la fraction 8/20 sous forme irréductible.", correctAnswer: "2/5" },
  { skillCode: "fractions", levelOrder: 1, gradeLevel: "6e", promptText: "Simplifie la fraction 18/24 sous forme irréductible.", correctAnswer: "3/4" },
  { skillCode: "division", levelOrder: 2, gradeLevel: "6e", promptText: "Calcule le quotient : 144 ÷ 12.", correctAnswer: "12" },
  { skillCode: "division", levelOrder: 2, gradeLevel: "6e", promptText: "Un lot de 250 images est partagé équitablement entre 25 enfants. Combien chaque enfant reçoit-il d'images ?", correctAnswer: "10" },
  { skillCode: "multiplication", levelOrder: 2, gradeLevel: "6e", promptText: "Calcule : 25 × 16.", correctAnswer: "400" },
  { skillCode: "multiplication", levelOrder: 2, gradeLevel: "6e", promptText: "Calcule : 125 × 8.", correctAnswer: "1000" },
];

async function seedCuratedExercises() {
  // Entièrement défensif : ne doit JAMAIS faire échouer le seed (donc le build/déploiement).
  try {
    for (const ex of CURATED_EXERCISES) {
      try {
        const existing = await prisma.curatedExercise.findFirst({ where: { promptText: ex.promptText } });
        if (existing) continue; // idempotent : respecte aussi une décision APPROVED/REJECTED déjà prise
        const skill = await prisma.skill.findUnique({ where: { code: ex.skillCode } });
        if (!skill) continue;
        const level = await prisma.level.findUnique({
          where: { skillId_order: { skillId: skill.id, order: ex.levelOrder } },
        });
        if (!level) continue;
        await prisma.curatedExercise.create({
          data: {
            levelId: level.id,
            promptText: ex.promptText,
            correctAnswer: ex.correctAnswer,
            sourceType: "INSPIRED_BY_SOURCE",
            sourceUrl: CURATED_SOURCE_URL,
            sourceLicense: CURATED_SOURCE_LICENSE,
            gradeLevel: ex.gradeLevel,
          },
        });
      } catch (err) {
        console.warn("Exercice curé ignoré (non bloquant) :", err);
      }
    }
    console.log("Exercices curés (seed) prêts — en attente de validation dans /dev/console.");
  } catch (err) {
    console.warn("seedCuratedExercises non bloquant, ignoré :", err);
  }
}

async function main() {
  await seedDevAdmin();
  await seedMathCurriculum();
  await seedBadges();
  await seedRewardCatalog();
  await seedCuratedExercises();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
