import { describe, it, expect } from "vitest";
import {
  drawMysteryBoxReward,
  MYSTERY_BOX_COST,
} from "@/lib/progression/mysteryBox";

describe("drawMysteryBoxReward", () => {
  it("attribue le jackpot (500) uniquement dans le premier centile", () => {
    expect(drawMysteryBoxReward(0)).toEqual({ rewardPoints: 500, isJackpot: true });
    expect(drawMysteryBoxReward(0.009)).toEqual({ rewardPoints: 500, isJackpot: true });
  });

  it("attribue les paliers intermédiaires selon la probabilité", () => {
    // [1%,5%[ -> +100
    expect(drawMysteryBoxReward(0.02)).toEqual({ rewardPoints: 100, isJackpot: false });
    // [5%,30%[ -> +50
    expect(drawMysteryBoxReward(0.2)).toEqual({ rewardPoints: 50, isJackpot: false });
    // [30%,100%[ -> +20
    expect(drawMysteryBoxReward(0.5)).toEqual({ rewardPoints: 20, isJackpot: false });
    expect(drawMysteryBoxReward(0.999)).toEqual({ rewardPoints: 20, isJackpot: false });
  });

  it("ne rapporte jamais moins que le coût d'ouverture (aucune perte nette possible)", () => {
    // Balayage fin de tout l'intervalle [0,1[ : chaque tirage doit être strictement > coût.
    for (let i = 0; i < 1000; i++) {
      const draw = drawMysteryBoxReward(i / 1000);
      expect(draw.rewardPoints).toBeGreaterThan(MYSTERY_BOX_COST);
    }
  });

  it("ne marque isJackpot que pour le lot de 500 points", () => {
    for (let i = 0; i < 1000; i++) {
      const draw = drawMysteryBoxReward(i / 1000);
      expect(draw.isJackpot).toBe(draw.rewardPoints === 500);
    }
  });
});
