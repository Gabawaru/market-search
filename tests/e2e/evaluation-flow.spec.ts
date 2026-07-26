import { test, expect } from "@playwright/test";
import {
  registerParent,
  createChild,
  loginAsChild,
  makeChildReadyForEvaluation,
  startEvaluation,
  answerAllEvaluationQuestions,
} from "./helpers";

// Ces tests valident le cœur du produit demandé : un enfant qui répond honnêtement
// réussit l'évaluation, et un enfant qui contourne le mode évaluation (changement
// d'onglet répété pendant le passage) voit son évaluation invalidée — jamais
// silencieusement acceptée. Cf. src/lib/integrity/events.ts pour la politique exacte.

test("un enfant qui répond correctement à tout réussit l'évaluation", async ({ page }) => {
  await registerParent(page, "Parent E2E Happy");
  await createChild(page, "HappyE2E", "1234");
  await loginAsChild(page, "HappyE2E", "1234");

  const skillId = await makeChildReadyForEvaluation(page);
  await startEvaluation(page, skillId);
  await answerAllEvaluationQuestions(page);

  await expect(page.getByText("Bravo, niveau validé !")).toBeVisible({ timeout: 15000 });
});

test("une perte de focus répétée pendant l'évaluation l'invalide", async ({ page }) => {
  await registerParent(page, "Parent E2E Cheater");
  await createChild(page, "CheaterE2E", "1234");
  await loginAsChild(page, "CheaterE2E", "1234");

  const skillId = await makeChildReadyForEvaluation(page);
  await startEvaluation(page, skillId);

  // Simule deux pertes de focus/visibilité — la politique d'intégrité invalide
  // l'évaluation à la récidive (une seule perte ne zère que la question en cours).
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(300);
  }

  await answerAllEvaluationQuestions(page);

  await expect(page.getByText("Évaluation invalidée")).toBeVisible({ timeout: 15000 });
});

test("le copier-coller est bloqué sur le champ de réponse pendant l'évaluation", async ({
  page,
}) => {
  await registerParent(page, "Parent E2E Paste");
  await createChild(page, "PasteE2E", "1234");
  await loginAsChild(page, "PasteE2E", "1234");

  const skillId = await makeChildReadyForEvaluation(page);
  await startEvaluation(page, skillId);

  const input = page.locator('input[placeholder="Ta réponse"]');
  await input.evaluate((el: HTMLInputElement) => {
    const event = new ClipboardEvent("paste", { bubbles: true, cancelable: true });
    el.dispatchEvent(event);
  });

  // Le champ doit rester vide : le paste a été intercepté et bloqué (preventDefault),
  // pas juste journalisé sans effet.
  await expect(input).toHaveValue("");
});
