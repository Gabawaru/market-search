// Génération de texte honnête et personnalisée, purement basée sur des métriques réelles
// (donc structurellement sans favoritisme ni sévérité injustifiée — pas de "sympathie").
// Remplacé/complété en Phase 8 par le scan IA automatisé qui peut appeler cette même
// fonction ou une variante plus riche.

export interface NarrativeInput {
  childName: string;
  objectiveScore: number; // 0-1
  effortScore: number; // 0-1
  exerciseCount: number;
  evaluationCount: number;
  passedCount: number;
}

export function buildNarrative(input: NarrativeInput): string {
  const { childName, objectiveScore, effortScore, exerciseCount, evaluationCount, passedCount } =
    input;

  if (exerciseCount === 0 && evaluationCount === 0) {
    return `${childName} n'a pas encore pratiqué sur cette période.`;
  }

  const scorePercent = Math.round(objectiveScore * 100);
  const parts: string[] = [];

  parts.push(
    `${childName} a réalisé ${exerciseCount} exercice${exerciseCount > 1 ? "s" : ""} d'entraînement` +
      (evaluationCount > 0
        ? ` et passé ${evaluationCount} évaluation${evaluationCount > 1 ? "s" : ""} (${passedCount} réussie${passedCount > 1 ? "s" : ""}).`
        : "."),
  );

  if (objectiveScore >= 0.9) {
    parts.push(`Les résultats sont excellents (${scorePercent}% de réussite en moyenne).`);
  } else if (objectiveScore >= 0.7) {
    parts.push(
      `Les résultats sont bons (${scorePercent}% de réussite en moyenne), avec encore une petite marge de progression.`,
    );
  } else {
    parts.push(
      `Les résultats montrent des difficultés sur cette période (${scorePercent}% de réussite en moyenne) — un accompagnement supplémentaire pourrait aider.`,
    );
  }

  if (effortScore >= 0.8) {
    parts.push("L'engagement est très régulier, c'est un vrai point fort.");
  } else if (effortScore >= 0.5) {
    parts.push("L'engagement est correct mais pourrait être plus régulier.");
  } else {
    parts.push("L'engagement reste irrégulier sur cette période.");
  }

  return parts.join(" ");
}
