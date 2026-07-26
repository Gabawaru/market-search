import { prisma } from "@/lib/db/prisma";

/** Récit de ce qui s'est passé lors d'une évaluation — jamais juste un tableau de chiffres,
 * toujours une phrase qui raconte l'événement, affichée au parent et référencée en cas de
 * désaccord (cf. marketplace de profs, phase 7). */
export async function createLessonStoryEntryForEvaluation(evaluationId: string) {
  const evaluation = await prisma.evaluation.findUniqueOrThrow({
    where: { id: evaluationId },
    include: { level: { include: { skill: true } }, child: true },
  });

  const scorePercent = Math.round((evaluation.totalScore ?? 0) * 100);
  let narrative: string;

  if (evaluation.status === "INVALIDATED") {
    narrative =
      `${evaluation.child.name} a commencé l'évaluation « ${evaluation.level.name} » ` +
      `(${evaluation.level.skill.name}), mais elle a été invalidée suite à une anomalie détectée ` +
      `pendant le passage (sortie de plein écran ou changement d'onglet répété). À retenter dans ` +
      `de bonnes conditions.`;
  } else if (evaluation.passed) {
    narrative =
      `${evaluation.child.name} a réussi l'évaluation « ${evaluation.level.name} » ` +
      `(${evaluation.level.skill.name}) avec ${scorePercent}% de bonnes réponses. Le niveau suivant ` +
      `est débloqué !`;
  } else {
    narrative =
      `${evaluation.child.name} a tenté l'évaluation « ${evaluation.level.name} » ` +
      `(${evaluation.level.skill.name}) et obtenu ${scorePercent}%, en dessous du seuil de réussite. ` +
      `Encore un peu d'entraînement avant de retenter.`;
  }

  return prisma.lessonStoryEntry.create({
    data: {
      childId: evaluation.childId,
      relatedEvaluationId: evaluation.id,
      title: `Évaluation — ${evaluation.level.skill.name}`,
      narrative,
    },
  });
}
