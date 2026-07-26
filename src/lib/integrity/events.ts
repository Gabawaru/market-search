import type { IntegrityAction, IntegrityEventType, IntegritySeverity } from "@/generated/prisma/client";

export interface IntegrityDecision {
  severity: IntegritySeverity;
  action: IntegrityAction;
}

/**
 * Politique de réaction aux événements d'intégrité pendant une évaluation.
 * Ajustable en un seul endroit — voir le plan produit pour la justification de chaque règle :
 * - Une perte de focus/onglet ponctuelle ne zère que la question en cours (proportionné).
 * - Une récidive du même type d'événement, ou une sortie de plein écran, invalide tout
 *   l'évaluation (signal fort de contournement délibéré).
 * - DevTools/copier-coller seuls ne suffisent jamais à zérer automatiquement (trop de faux
 *   positifs possibles) : ils sont journalisés/avertis et alimentent le score de suspicion
 *   combiné consultable par le parent/prof.
 * - Le détecteur IA texte ne zère jamais seul une réponse (cf. heuristicDetector) : il est
 *   uniquement journalisé ici, pour éviter de pénaliser un faux positif sur un enfant précoce.
 */
export function decideIntegrityAction(
  type: IntegrityEventType,
  priorOccurrencesOfSameType: number,
): IntegrityDecision {
  switch (type) {
    case "FULLSCREEN_EXIT":
      return { severity: "HIGH", action: "ZEROED_EVALUATION" };

    case "VISIBILITY_HIDDEN":
    case "WINDOW_BLUR":
      if (priorOccurrencesOfSameType >= 1) {
        return { severity: "HIGH", action: "ZEROED_EVALUATION" };
      }
      return { severity: "MEDIUM", action: "ZEROED_QUESTION" };

    case "MULTI_TAB_DETECTED":
      return { severity: "HIGH", action: "ZEROED_EVALUATION" };

    case "DEVTOOLS_SUSPECTED":
      return { severity: "LOW", action: "WARNED" };

    case "COPY_ATTEMPT":
    case "PASTE_ATTEMPT":
      return { severity: "LOW", action: "WARNED" };

    case "AI_TEXT_SUSPECTED":
      return { severity: "MEDIUM", action: "LOGGED_ONLY" };

    case "SESSION_TOKEN_INVALID":
    case "HEARTBEAT_MISSED":
      return { severity: "MEDIUM", action: "LOGGED_ONLY" };

    default:
      return { severity: "LOW", action: "LOGGED_ONLY" };
  }
}
