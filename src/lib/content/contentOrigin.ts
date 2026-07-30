export type ContentOrigin = "generated" | "teacher";

/** Le libellé "généré" reste volontairement positif : l'entraînement automatique est la
 * colonne vertébrale du produit, pas un lot de consolation face aux exercices de profs. */
export function contentOriginLabel(origin: ContentOrigin, authorName?: string | null): string {
  if (origin === "teacher") {
    return authorName ? `Écrit et corrigé par ${authorName}` : "Écrit et corrigé par un vrai prof";
  }
  return "Généré automatiquement pour toi";
}

export function contentOriginIcon(origin: ContentOrigin): string {
  return origin === "teacher" ? "✍️" : "⚙️";
}
