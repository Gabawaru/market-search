import type { AiTextDetector } from "@/lib/integrity/aiTextDetector/types";
import { heuristicDetector } from "@/lib/integrity/aiTextDetector/heuristicDetector";

const registry: Record<string, AiTextDetector> = {
  heuristic: heuristicDetector,
};

/** Sélectionné via AI_TEXT_DETECTOR_PROVIDER — brancher un détecteur externe plus tard ne
 * demande qu'une nouvelle entrée ici, aucun site d'appel à modifier. */
export function getAiTextDetector(): AiTextDetector {
  const key = process.env.AI_TEXT_DETECTOR_PROVIDER ?? "heuristic";
  const detector = registry[key];
  if (!detector) {
    throw new Error(`Détecteur de texte IA inconnu : ${key}`);
  }
  return detector;
}
