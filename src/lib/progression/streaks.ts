import { prisma } from "@/lib/db/prisma";
import { awardPoints } from "@/lib/progression/points";
import { maybeAwardBadge } from "@/lib/progression/badges";

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Pure : calcule la nouvelle série à partir de la dernière activité connue. Séparée de
 * recordDailyActivity pour être testable sans base de données.
 *
 * "Jour de repos" (récompense STREAK_FREEZE, cf. RewardCatalogItem.kind) : si l'enfant a manqué
 * exactement un jour (gap de 2) et dispose d'au moins un jour de repos non consommé, la série
 * continue au lieu d'être remise à 1 — un seul jour de repos couvre un seul jour manqué, jamais
 * plusieurs jours d'affilée (comportement volontairement simple et prévisible). */
export function computeNextStreak(
  lastActivityDate: Date | null,
  now: Date,
  currentStreak: number,
  availableStreakFreezes = 0,
): { nextStreak: number; alreadyCountedToday: boolean; freezeConsumed: boolean } {
  const today = startOfDay(now);

  if (lastActivityDate && startOfDay(lastActivityDate).getTime() === today.getTime()) {
    return { nextStreak: currentStreak, alreadyCountedToday: true, freezeConsumed: false };
  }

  const gapDays = lastActivityDate
    ? Math.round((today.getTime() - startOfDay(lastActivityDate).getTime()) / ONE_DAY_MS)
    : null;

  if (gapDays === 1) {
    return { nextStreak: currentStreak + 1, alreadyCountedToday: false, freezeConsumed: false };
  }

  if (gapDays === 2 && availableStreakFreezes > 0) {
    return { nextStreak: currentStreak + 1, alreadyCountedToday: false, freezeConsumed: true };
  }

  return { nextStreak: 1, alreadyCountedToday: false, freezeConsumed: false };
}

/** À appeler à chaque activité (practice ou évaluation) : incrémente la série si l'enfant
 * s'est déjà entraîné hier, la remet à 1 en cas de trou, ne compte qu'une fois par jour. */
export async function recordDailyActivity(childId: string) {
  const now = new Date();

  const streak = await prisma.streak.findUnique({ where: { childId } });
  if (!streak) {
    await prisma.streak.create({
      data: { childId, currentStreak: 1, longestStreak: 1, lastActivityDate: now },
    });
    return { currentStreak: 1 };
  }

  const availableStreakFreezes = await prisma.rewardRedemption.count({
    where: { childId, consumedAt: null, item: { kind: "STREAK_FREEZE" } },
  });

  const { nextStreak, alreadyCountedToday, freezeConsumed } = computeNextStreak(
    streak.lastActivityDate,
    now,
    streak.currentStreak,
    availableStreakFreezes,
  );
  if (alreadyCountedToday) {
    return { currentStreak: streak.currentStreak };
  }

  if (freezeConsumed) {
    const oldestFreeze = await prisma.rewardRedemption.findFirst({
      where: { childId, consumedAt: null, item: { kind: "STREAK_FREEZE" } },
      orderBy: { redeemedAt: "asc" },
    });
    if (oldestFreeze) {
      await prisma.rewardRedemption.update({
        where: { id: oldestFreeze.id },
        data: { consumedAt: now },
      });
    }
  }

  const longestStreak = Math.max(streak.longestStreak, nextStreak);

  await prisma.streak.update({
    where: { childId },
    data: { currentStreak: nextStreak, longestStreak, lastActivityDate: now },
  });

  if (nextStreak === 30) {
    await awardPoints(childId, "EARNED_STREAK", 50, "Série de 30 jours");
    await maybeAwardBadge(childId, "streak_30");
  } else if (nextStreak === 7) {
    await awardPoints(childId, "EARNED_STREAK", 20, "Série de 7 jours");
    await maybeAwardBadge(childId, "streak_7");
  }

  return { currentStreak: nextStreak };
}
