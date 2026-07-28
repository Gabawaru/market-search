import { prisma } from "@/lib/db/prisma";

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export interface StreakDay {
  date: Date;
  active: boolean;
}

/** Pure : construit les `days` derniers jours (aujourd'hui inclus, en dernier) à partir des dates
 * où l'enfant a été actif — sans base de données, pour être testable. */
export function buildStreakTimeline(activeDates: Date[], today: Date, days: number): StreakDay[] {
  const activeDaySet = new Set(activeDates.map((d) => startOfDay(d).getTime()));
  const start = startOfDay(today);

  const timeline: StreakDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(start);
    date.setDate(date.getDate() - i);
    timeline.push({ date, active: activeDaySet.has(date.getTime()) });
  }
  return timeline;
}

/** Un jour compte comme actif s'il a au moins un exercice de practice ou une évaluation terminée
 * — les mêmes signaux que recordDailyActivity (src/lib/progression/streaks.ts) consulte pour
 * faire progresser la série, pour que la timeline corresponde exactement à ce que l'enfant voit
 * dans son compteur de jours de suite. */
export async function getStreakTimeline(childId: string, days = 14, now = new Date()) {
  const start = new Date(startOfDay(now));
  start.setDate(start.getDate() - (days - 1));

  const [attempts, evaluations] = await Promise.all([
    prisma.exerciseAttempt.findMany({
      where: { childId, createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    prisma.evaluation.findMany({
      where: { childId, finishedAt: { gte: start } },
      select: { finishedAt: true },
    }),
  ]);

  const activeDates = [
    ...attempts.map((a) => a.createdAt),
    ...evaluations.map((e) => e.finishedAt).filter((d): d is Date => d !== null),
  ];

  return buildStreakTimeline(activeDates, now, days);
}
