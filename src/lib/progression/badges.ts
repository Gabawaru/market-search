import { prisma } from "@/lib/db/prisma";
import { awardPoints } from "@/lib/progression/points";

export async function maybeAwardBadge(childId: string, badgeCode: string) {
  const badge = await prisma.badge.findUnique({ where: { code: badgeCode } });
  if (!badge) return;

  const existing = await prisma.childBadge.findUnique({
    where: { childId_badgeId: { childId, badgeId: badge.id } },
  });
  if (existing) return;

  await prisma.childBadge.create({ data: { childId, badgeId: badge.id } });
  await awardPoints(childId, "EARNED_BADGE", 25, `Badge obtenu : ${badge.label}`);
}

export async function checkExerciseCountBadges(childId: string) {
  const count = await prisma.exerciseAttempt.count({ where: { childId } });
  if (count >= 100) {
    await maybeAwardBadge(childId, "hundred_exercises");
  }
}
