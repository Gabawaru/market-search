import { prisma } from "@/lib/db/prisma";

export const MIN_PRACTICE_EXERCISES_SINCE_LAST_STREAK_FREEZE = 10;

export interface StreakFreezeEligibilityInput {
  unconsumedStreakFreezeCount: number;
  practiceExercisesSinceLastStreakFreeze: number;
}

export interface StreakFreezeEligibilityResult {
  eligible: boolean;
  reason?: string;
}

/** Pure : un jour de repos ne doit pas être un raccourci sans effort. On ne peut pas en avoir
 * plus d'un non consommé à la fois (pas de stock), et il faut avoir réellement pratiqué — pas
 * seulement avoir assez de points — depuis le dernier jour de repos acheté avant d'en racheter
 * un nouveau. */
export function checkStreakFreezeEligibility({
  unconsumedStreakFreezeCount,
  practiceExercisesSinceLastStreakFreeze,
}: StreakFreezeEligibilityInput): StreakFreezeEligibilityResult {
  if (unconsumedStreakFreezeCount > 0) {
    return {
      eligible: false,
      reason: "Tu as déjà un jour de repos en réserve — utilise-le avant d'en racheter un autre.",
    };
  }

  if (practiceExercisesSinceLastStreakFreeze < MIN_PRACTICE_EXERCISES_SINCE_LAST_STREAK_FREEZE) {
    const remaining =
      MIN_PRACTICE_EXERCISES_SINCE_LAST_STREAK_FREEZE - practiceExercisesSinceLastStreakFreeze;
    return {
      eligible: false,
      reason: `Entraîne-toi encore un peu avant d'en racheter un (encore ${remaining} exercice${remaining > 1 ? "s" : ""}).`,
    };
  }

  return { eligible: true };
}

export async function getStreakFreezeEligibility(
  childId: string,
): Promise<StreakFreezeEligibilityResult> {
  const [unconsumedStreakFreezeCount, lastStreakFreezeRedemption] = await Promise.all([
    prisma.rewardRedemption.count({
      where: { childId, consumedAt: null, item: { kind: "STREAK_FREEZE" } },
    }),
    prisma.rewardRedemption.findFirst({
      where: { childId, item: { kind: "STREAK_FREEZE" } },
      orderBy: { redeemedAt: "desc" },
    }),
  ]);

  const practiceExercisesSinceLastStreakFreeze = await prisma.pointsTransaction.count({
    where: {
      wallet: { childId },
      type: "EARNED_EXERCISE",
      ...(lastStreakFreezeRedemption
        ? { createdAt: { gt: lastStreakFreezeRedemption.redeemedAt } }
        : {}),
    },
  });

  return checkStreakFreezeEligibility({
    unconsumedStreakFreezeCount,
    practiceExercisesSinceLastStreakFreeze,
  });
}
