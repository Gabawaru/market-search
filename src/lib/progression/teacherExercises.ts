import { prisma } from "@/lib/db/prisma";
import { getOrCreateWallet } from "@/lib/progression/points";
import { getOrCreateSkillProgress } from "@/lib/progression/unlockRules";

/** Seuil non consommé (contrairement à spendPoints/la boutique de récompenses) : l'enfant doit
 * avoir accumulé au moins pointsRequired, mais ils ne sont pas débités — même logique de seuil
 * que isReadyForEvaluation, appliquée aux points plutôt qu'à la maîtrise. */
export function isReadyForTeacherExercise(
  walletBalance: number,
  childCurrentLevelOrder: number,
  exercise: { pointsRequired: number; level: { order: number } },
): boolean {
  return walletBalance >= exercise.pointsRequired && childCurrentLevelOrder >= exercise.level.order;
}

/** Recalcule l'accès côté serveur — ne jamais faire confiance à un enfant qui déclencherait
 * une soumission directement via l'API. */
export async function checkTeacherExerciseAccess(childId: string, teacherExerciseId: string) {
  const exercise = await prisma.teacherExercise.findUniqueOrThrow({
    where: { id: teacherExerciseId },
    include: { level: true },
  });
  const wallet = await getOrCreateWallet(childId);
  const progress = await getOrCreateSkillProgress(childId, exercise.level.skillId);
  const currentLevel = progress.currentLevelId
    ? await prisma.level.findUniqueOrThrow({ where: { id: progress.currentLevelId } })
    : null;
  // -1 : l'enfant n'a pas encore commencé cette compétence, donc n'a atteint aucun niveau.
  const childCurrentLevelOrder = currentLevel?.order ?? -1;

  return {
    eligible: isReadyForTeacherExercise(wallet.balance, childCurrentLevelOrder, exercise),
    exercise,
  };
}
