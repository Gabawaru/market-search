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
 * recordDailyActivity pour être testable sans base de données. */
export function computeNextStreak(
  lastActivityDate: Date | null,
  now: Date,
  currentStreak: number,
): { nextStreak: number; alreadyCountedToday: boolean } {
  const today = startOfDay(now);

  if (lastActivityDate && startOfDay(lastActivityDate).getTime() === today.getTime()) {
    return { nextStreak: currentStreak, alreadyCountedToday: true };
  }

  const gapDays = lastActivityDate
    ? Math.round((today.getTime() - startOfDay(lastActivityDate).getTime()) / ONE_DAY_MS)
    : null;

  return { nextStreak: gapDays === 1 ? currentStreak + 1 : 1, alreadyCountedToday: false };
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

  const { nextStreak, alreadyCountedToday } = computeNextStreak(
    streak.lastActivityDate,
    now,
    streak.currentStreak,
  );
  if (alreadyCountedToday) {
    return { currentStreak: streak.currentStreak };
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
