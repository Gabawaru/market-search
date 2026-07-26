import * as math from "@/lib/exercises/generators/math";
import type { GeneratedExercise } from "@/lib/exercises/generators/math";

export type ExerciseGeneratorFn = (
  seed: string,
  params: Record<string, unknown>,
) => GeneratedExercise;

// Interface pluggable : ajouter un générateur = ajouter une entrée ici, sans toucher
// au reste du moteur (instance.ts, practiceFlow.ts).
export const exerciseGeneratorRegistry: Record<string, ExerciseGeneratorFn> = {
  "addition-basic": math.generateAddition,
  "subtraction-basic": math.generateSubtraction,
  "multiplication-table": math.generateMultiplication,
  "division-exact": math.generateDivision,
  "numeration-successor": math.generateSuccessor,
  "numeration-predecessor": math.generatePredecessor,
  "numeration-compare": math.generateCompareLarger,
  "fraction-simplify": math.generateFractionSimplify,
};

export function getGenerator(generatorKey: string): ExerciseGeneratorFn {
  const generator = exerciseGeneratorRegistry[generatorKey];
  if (!generator) {
    throw new Error(`Générateur d'exercice inconnu : ${generatorKey}`);
  }
  return generator;
}
