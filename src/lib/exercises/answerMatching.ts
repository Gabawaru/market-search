function parseFraction(input: string): [number, number] | null {
  const match = input.trim().match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2])];
}

/** Compare une réponse d'enfant à la réponse correcte : nombres, fractions (par
 * équivalence, pas seulement égalité textuelle) et texte brut en repli. */
export function answersMatch(given: string, correct: string): boolean {
  const g = given.trim();
  const c = correct.trim();
  if (g === c) return true;
  if (g.length === 0) return false;

  const gFrac = parseFraction(g);
  const cFrac = parseFraction(c);
  if (gFrac && cFrac) {
    return gFrac[0] * cFrac[1] === cFrac[0] * gFrac[1];
  }

  const gNum = Number(g);
  const cNum = Number(c);
  if (!Number.isNaN(gNum) && !Number.isNaN(cNum) && g !== "" && c !== "") {
    return Math.abs(gNum - cNum) < 1e-9;
  }

  return false;
}
