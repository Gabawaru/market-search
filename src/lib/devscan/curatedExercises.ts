import { prisma } from "@/lib/db/prisma";
import type { CuratedExerciseSourceType } from "@/generated/prisma/client";

/** Point d'entrée utilisé par la Routine Claude de curation périodique (collège/lycée) pour
 * proposer un exercice — jamais publié automatiquement, toujours en attente de validation dans
 * l'espace développeur. La correction doit rester déterministe (correctAnswer vérifiable via
 * answersMatch), jamais une correction devinée par une IA. */
export function createCuratedExercise(params: {
  levelId: string;
  promptText: string;
  correctAnswer: string;
  sourceType: CuratedExerciseSourceType;
  sourceUrl: string;
  sourceLicense: string;
  gradeLevel?: string | null;
}) {
  return prisma.curatedExercise.create({
    data: {
      levelId: params.levelId,
      promptText: params.promptText,
      correctAnswer: params.correctAnswer,
      sourceType: params.sourceType,
      sourceUrl: params.sourceUrl,
      sourceLicense: params.sourceLicense,
      gradeLevel: params.gradeLevel ?? null,
    },
  });
}
