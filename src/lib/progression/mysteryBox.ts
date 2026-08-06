import { prisma } from "@/lib/db/prisma";
import { getOrCreateDailyRecommendation } from "@/lib/progression/recommendation";

/** Coût d'ouverture de la boîte surprise (l'« achat » demandé). Toujours inférieur au plus petit
 * gain possible : ouvrir la boîte ne fait jamais perdre de points net. */
export const MYSTERY_BOX_COST = 10;

/** Nombre minimal d'exercices à faire dans la journée pour débloquer la boîte. */
export const MYSTERY_BOX_MIN_DAILY_ATTEMPTS = 10;

export interface MysteryBoxDraw {
  rewardPoints: number;
  isJackpot: boolean;
}

/** Pur et testable : tire une récompense à partir d'un nombre aléatoire dans [0, 1[.
 * Distribution : 1 % jackpot (+500), 4 % (+100), 25 % (+50), 70 % (+20).
 * Aucun tirage n'est inférieur au coût (jamais de perte nette). Le lot rare est un JACKPOT DE
 * POINTS INTERNES — jamais une récompense à valeur monétaire réelle. */
export function drawMysteryBoxReward(rand: number): MysteryBoxDraw {
  const r = rand * 100;
  if (r < 1) return { rewardPoints: 500, isJackpot: true };
  if (r < 5) return { rewardPoints: 100, isJackpot: false };
  if (r < 30) return { rewardPoints: 50, isJackpot: false };
  return { rewardPoints: 20, isJackpot: false };
}

/** Clé de jour civil (minuit local) utilisée par la contrainte d'unicité [childId, date] :
 * garantit une seule boîte par enfant et par jour, et un même point de référence entre la lecture
 * de l'état (getMysteryBoxStatus) et l'écriture de la ligne (openMysteryBox). */
export function mysteryBoxDateKey(date = new Date()): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfDay(date: Date): Date {
  return mysteryBoxDateKey(date);
}

export interface MysteryBoxStatus {
  eligible: boolean;
  reason?: string;
  alreadyOpenedToday: boolean;
  todayReward: number | null;
  todayJackpot: boolean;
}

/** Décrit l'état de la boîte du jour pour un enfant : déjà ouverte (et son gain), ou débloquable
 * (cours du jour pratiqué + assez d'exercices), ou verrouillée avec la raison. */
export async function getMysteryBoxStatus(childId: string, now = new Date()): Promise<MysteryBoxStatus> {
  const today = startOfDay(now);

  const existing = await prisma.dailyMysteryBox.findUnique({
    where: { childId_date: { childId, date: today } },
  });
  if (existing) {
    return {
      eligible: false,
      alreadyOpenedToday: true,
      todayReward: existing.rewardPoints,
      todayJackpot: existing.isJackpot,
    };
  }

  const attemptsToday = await prisma.exerciseAttempt.count({
    where: { childId, createdAt: { gte: today } },
  });
  if (attemptsToday < MYSTERY_BOX_MIN_DAILY_ATTEMPTS) {
    const remaining = MYSTERY_BOX_MIN_DAILY_ATTEMPTS - attemptsToday;
    return {
      eligible: false,
      reason: `Fais encore ${remaining} exercice${remaining > 1 ? "s" : ""} aujourd'hui pour débloquer la boîte.`,
      alreadyOpenedToday: false,
      todayReward: null,
      todayJackpot: false,
    };
  }

  const recommendation = await getOrCreateDailyRecommendation(childId, now);
  if (recommendation) {
    const practicedRecToday = await prisma.exerciseAttempt.count({
      where: {
        childId,
        createdAt: { gte: today },
        exerciseInstance: { exercise: { level: { skillId: recommendation.skillId } } },
      },
    });
    if (practicedRecToday === 0) {
      return {
        eligible: false,
        reason: "Fais d'abord le cours du jour (ta « prochaine étape ») pour débloquer la boîte.",
        alreadyOpenedToday: false,
        todayReward: null,
        todayJackpot: false,
      };
    }
  }

  return { eligible: true, alreadyOpenedToday: false, todayReward: null, todayJackpot: false };
}
