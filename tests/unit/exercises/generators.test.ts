import { describe, it, expect } from "vitest";
import {
  generateAddition,
  generateSubtraction,
  generateMultiplication,
  generateDivision,
  generateSuccessor,
  generatePredecessor,
  generateCompareLarger,
  generateFractionSimplify,
} from "@/lib/exercises/generators/math";

describe("exercise generators", () => {
  it("is deterministic for a given seed", () => {
    const a = generateAddition("same-seed", { min: 1, max: 20 });
    const b = generateAddition("same-seed", { min: 1, max: 20 });
    expect(a).toEqual(b);
  });

  it("addition: correctAnswer matches the sum in the prompt", () => {
    const { promptText, correctAnswer } = generateAddition("seed-1", { min: 1, max: 20 });
    const [x, y] = promptText.match(/(\d+) \+ (\d+)/)!.slice(1).map(Number);
    expect(Number(correctAnswer.value)).toBe(x + y);
  });

  it("subtraction: never produces a negative result", () => {
    for (let i = 0; i < 50; i++) {
      const { correctAnswer } = generateSubtraction(`seed-${i}`, { min: 1, max: 20 });
      expect(Number(correctAnswer.value)).toBeGreaterThanOrEqual(0);
    }
  });

  it("multiplication: correctAnswer matches the product", () => {
    const { promptText, correctAnswer } = generateMultiplication("seed-2", { maxFactor: 10 });
    const [x, y] = promptText.match(/(\d+) × (\d+)/)!.slice(1).map(Number);
    expect(Number(correctAnswer.value)).toBe(x * y);
  });

  it("division: is always exact (no remainder)", () => {
    for (let i = 0; i < 50; i++) {
      const { promptText, correctAnswer } = generateDivision(`seed-${i}`, {
        maxDivisor: 10,
        maxQuotient: 10,
      });
      const [dividend, divisor] = promptText.match(/(\d+) ÷ (\d+)/)!.slice(1).map(Number);
      expect(dividend % divisor).toBe(0);
      expect(Number(correctAnswer.value)).toBe(dividend / divisor);
    }
  });

  it("successor and predecessor are consistent", () => {
    const succ = generateSuccessor("seed-3", { min: 0, max: 100 });
    const n = Number(succ.promptText.match(/après (\d+)/)![1]);
    expect(Number(succ.correctAnswer.value)).toBe(n + 1);

    const pred = generatePredecessor("seed-4", { min: 1, max: 100 });
    const m = Number(pred.promptText.match(/avant (\d+)/)![1]);
    expect(Number(pred.correctAnswer.value)).toBe(m - 1);
  });

  it("compare-larger never asks to compare a number with itself", () => {
    for (let i = 0; i < 50; i++) {
      const { promptText } = generateCompareLarger(`seed-${i}`, { min: 0, max: 5 });
      const [a, b] = promptText.match(/entre (\d+) et (\d+)/)!.slice(1).map(Number);
      expect(a).not.toBe(b);
    }
  });

  it("fraction-simplify always returns an already-simplified fraction", () => {
    function gcd(a: number, b: number): number {
      return b === 0 ? a : gcd(b, a % b);
    }
    for (let i = 0; i < 50; i++) {
      const { correctAnswer } = generateFractionSimplify(`seed-${i}`, { maxDenominator: 12 });
      const [num, den] = correctAnswer.value.split("/").map(Number);
      expect(gcd(num, den)).toBe(1);
    }
  });
});
