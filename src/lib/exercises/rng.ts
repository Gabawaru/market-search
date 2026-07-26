// PRNG déterministe (mulberry32) dérivé d'une graine texte : permet de régénérer le même
// exercice à partir du seed stocké, même si en pratique le prompt/la réponse sont déjà
// mis en cache dans ExerciseInstance dès la génération.

function hashStringToInt(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: string) {
  const random = mulberry32(hashStringToInt(seed));
  return {
    /** Entier aléatoire entre min et max, bornes incluses. */
    int(min: number, max: number): number {
      return Math.floor(random() * (max - min + 1)) + min;
    },
    float(): number {
      return random();
    },
  };
}
