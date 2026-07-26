import { createRng } from "@/lib/exercises/rng";

export interface GeneratedExercise {
  promptText: string;
  correctAnswer: { value: string };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function generateAddition(
  seed: string,
  params: { min?: number; max?: number } = {},
): GeneratedExercise {
  const { min = 1, max = 20 } = params;
  const rng = createRng(seed);
  const a = rng.int(min, max);
  const b = rng.int(min, max);
  return { promptText: `${a} + ${b} = ?`, correctAnswer: { value: String(a + b) } };
}

export function generateSubtraction(
  seed: string,
  params: { min?: number; max?: number } = {},
): GeneratedExercise {
  const { min = 1, max = 20 } = params;
  const rng = createRng(seed);
  const a = rng.int(min, max);
  const b = rng.int(min, a); // b <= a : pas de résultat négatif
  return { promptText: `${a} - ${b} = ?`, correctAnswer: { value: String(a - b) } };
}

export function generateMultiplication(
  seed: string,
  params: { maxFactor?: number } = {},
): GeneratedExercise {
  const { maxFactor = 10 } = params;
  const rng = createRng(seed);
  const a = rng.int(0, maxFactor);
  const b = rng.int(0, maxFactor);
  return { promptText: `${a} × ${b} = ?`, correctAnswer: { value: String(a * b) } };
}

export function generateDivision(
  seed: string,
  params: { maxDivisor?: number; maxQuotient?: number } = {},
): GeneratedExercise {
  const { maxDivisor = 10, maxQuotient = 10 } = params;
  const rng = createRng(seed);
  const divisor = rng.int(1, maxDivisor);
  const quotient = rng.int(0, maxQuotient);
  const dividend = divisor * quotient;
  return { promptText: `${dividend} ÷ ${divisor} = ?`, correctAnswer: { value: String(quotient) } };
}

export function generateSuccessor(
  seed: string,
  params: { min?: number; max?: number } = {},
): GeneratedExercise {
  const { min = 0, max = 100 } = params;
  const rng = createRng(seed);
  const n = rng.int(min, max);
  return {
    promptText: `Quel nombre vient juste après ${n} ?`,
    correctAnswer: { value: String(n + 1) },
  };
}

export function generatePredecessor(
  seed: string,
  params: { min?: number; max?: number } = {},
): GeneratedExercise {
  const { min = 1, max = 100 } = params;
  const rng = createRng(seed);
  const n = rng.int(min, max);
  return {
    promptText: `Quel nombre vient juste avant ${n} ?`,
    correctAnswer: { value: String(n - 1) },
  };
}

export function generateCompareLarger(
  seed: string,
  params: { min?: number; max?: number } = {},
): GeneratedExercise {
  const { min = 0, max = 100 } = params;
  const rng = createRng(seed);
  const a = rng.int(min, max);
  let b = rng.int(min, max);
  if (b === a) b = a === max ? a - 1 : a + 1;
  return {
    promptText: `Quel est le plus grand nombre entre ${a} et ${b} ?`,
    correctAnswer: { value: String(Math.max(a, b)) },
  };
}

export function generateFractionSimplify(
  seed: string,
  params: { maxDenominator?: number } = {},
): GeneratedExercise {
  const { maxDenominator = 12 } = params;
  const rng = createRng(seed);
  const factor = rng.int(2, 4);
  const rawDenominator = rng.int(2, maxDenominator);
  const rawNumerator = rng.int(1, rawDenominator - 1);
  const g = gcd(rawNumerator, rawDenominator);
  const simplifiedNumerator = rawNumerator / g;
  const simplifiedDenominator = rawDenominator / g;
  const numerator = simplifiedNumerator * factor;
  const denominator = simplifiedDenominator * factor;

  return {
    promptText: `Simplifie cette fraction : ${numerator}/${denominator}`,
    correctAnswer: { value: `${simplifiedNumerator}/${simplifiedDenominator}` },
  };
}
