import type { Page } from "@playwright/test";

export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
}

export async function registerParent(page: Page, name: string): Promise<string> {
  const email = uniqueEmail("parent");
  await page.goto("/parent/register");
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "SuperSecret123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  return email;
}

export async function createChild(
  page: Page,
  name: string,
  pin: string,
): Promise<string> {
  await page.goto("/dashboard/children/new");
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="birthYear"]', "2015");
  await page.fill('input[name="pin"]', pin);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });

  const link = page.locator(`a:has-text("${name}")`).first();
  const href = await link.getAttribute("href");
  if (!href) throw new Error(`Could not find dashboard link for child ${name}`);
  return href.split("/")[2];
}

export async function loginAsChild(page: Page, name: string, pin: string) {
  await page.goto("/child/select-profile");
  await page.click(`text=${name}`);
  await page.waitForURL(/\/child\/pin/, { timeout: 15000 });
  await page.fill('input[name="pin"]', pin);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/app", { timeout: 15000 });
}

/** Fait pratiquer l'enfant sur "Addition" jusqu'à devenir éligible à l'évaluation
 * (15 bonnes réponses, seuil de maîtrise par défaut). Retourne le skillId. */
export async function makeChildReadyForEvaluation(page: Page): Promise<string> {
  await page.goto("/app/practice");
  await page.click("text=Addition");
  await page.waitForURL(/\/app\/practice\//, { timeout: 15000 });
  const skillId = page.url().match(/\/app\/practice\/([^/?]+)/)?.[1];
  if (!skillId) throw new Error("Could not extract skillId from practice URL");

  for (let i = 0; i < 15; i++) {
    await page.waitForSelector('input[placeholder="Ta réponse"]', { timeout: 15000 });
    const promptText = await page.textContent("div.text-3xl");
    const match = promptText?.match(/(\d+)\s*\+\s*(\d+)/);
    if (!match) throw new Error(`Unexpected prompt: ${promptText}`);
    const answer = Number(match[1]) + Number(match[2]);
    await page.fill('input[placeholder="Ta réponse"]', String(answer));
    await page.click('button[type="submit"]');
    await page.waitForSelector("text=/Bravo|Exactement|Bien joué|Parfait|C'est ça|Super/", {
      timeout: 15000,
    });
    if (i < 14) await page.click("text=Exercice suivant");
  }

  return skillId;
}

export async function startEvaluation(page: Page, skillId: string) {
  await page.goto(`/app/practice/${skillId}`);
  await page.click("text=Passer l'évaluation de ce niveau");
  await page.waitForURL(/\/app\/evaluation\//, { timeout: 15000 });
  await page.click("text=Commencer l'évaluation en plein écran");
  await page.waitForFunction(() => document.body.innerText.includes("1 / 10"), {
    timeout: 15000,
  });
}

/** Répond correctement à toutes les questions restantes de l'évaluation en cours. */
export async function answerAllEvaluationQuestions(page: Page, totalQuestions = 10) {
  for (let i = 1; i <= totalQuestions; i++) {
    const stillRunning = await page.locator('input[placeholder="Ta réponse"]').count();
    if (stillRunning === 0) break;
    await page.waitForFunction(
      (n) => document.body.innerText.includes(`${n} / 10`),
      i,
      { timeout: 15000 },
    );
    const promptText = await page.textContent("div.text-3xl");
    const match = promptText?.match(/(\d+)\s*\+\s*(\d+)/);
    if (!match) throw new Error(`Unexpected prompt: ${promptText}`);
    const answer = Number(match[1]) + Number(match[2]);
    await page.fill('input[placeholder="Ta réponse"]', String(answer));
    await page.click('button[type="submit"]');
  }
}
