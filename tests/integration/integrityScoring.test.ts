import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { recordIntegrityEvent } from "@/lib/integrity/scoring";
import { hashSecret } from "@/lib/auth/password";

// Régression pour un IDOR corrigé : `evaluationAttemptId` vient du corps de la requête
// (jamais garanti appartenir à l'évaluation de l'URL) — recordIntegrityEvent ne doit
// jamais zérer la tentative d'un enfant à partir de l'évaluation d'un autre enfant.

async function createChildWithEvaluation(suffix: string) {
  const parent = await prisma.parent.create({
    data: {
      email: `integrity-test-${suffix}-${Date.now()}@example.com`,
      passwordHash: await hashSecret("SuperSecret123"),
      name: `Parent ${suffix}`,
    },
  });
  const child = await prisma.child.create({
    data: {
      parentId: parent.id,
      name: `Child ${suffix}`,
      pinHash: await hashSecret("1234"),
      birthYear: 2015,
    },
  });
  // Fixtures pédagogiques propres au test (indépendantes du seed applicatif, pour que ce
  // test tourne aussi bien en CI qu'en local sans dépendre de `npm run db:seed`).
  const subject = await prisma.subject.create({
    data: { code: `TEST-MATH-${suffix}-${Date.now()}`, name: "Mathématiques (test)" },
  });
  const skill = await prisma.skill.create({
    data: {
      code: `test-addition-${suffix}-${Date.now()}`,
      name: "Addition (test)",
      order: 1,
      minAge: 6,
      subjectId: subject.id,
    },
  });
  const level = await prisma.level.create({
    data: { skillId: skill.id, order: 1, name: "Niveau test" },
  });
  const exercise = await prisma.exercise.create({
    data: {
      levelId: level.id,
      type: "NUMERIC",
      generatorKey: "addition-basic",
      paramsSchema: { min: 1, max: 10 },
    },
  });
  const instance = await prisma.exerciseInstance.create({
    data: {
      exerciseId: exercise.id,
      seed: `seed-${suffix}`,
      promptText: "1 + 1 = ?",
      correctAnswer: { value: "2" },
    },
  });
  const evaluation = await prisma.evaluation.create({
    data: { childId: child.id, levelId: level.id, status: "IN_PROGRESS", startedAt: new Date() },
  });
  const attempt = await prisma.evaluationAttempt.create({
    data: { evaluationId: evaluation.id, exerciseInstanceId: instance.id, order: 1 },
  });

  return { parent, child, evaluation, attempt };
}

describe("recordIntegrityEvent (IDOR regression)", () => {
  const createdParentIds: string[] = [];

  afterAll(async () => {
    await prisma.parent.deleteMany({ where: { id: { in: createdParentIds } } });
  });

  it("never zeroes an evaluationAttempt that belongs to a different evaluation", async () => {
    const victim = await createChildWithEvaluation("victim");
    const attacker = await createChildWithEvaluation("attacker");
    createdParentIds.push(victim.parent.id, attacker.parent.id);

    // L'attaquant appelle recordIntegrityEvent avec SA PROPRE évaluation dans l'URL, mais
    // fournit l'ID de tentative de la victime dans le corps — exactement le vecteur trouvé
    // par la revue de sécurité.
    await recordIntegrityEvent({
      evaluationId: attacker.evaluation.id,
      childId: attacker.child.id,
      evaluationAttemptId: victim.attempt.id,
      type: "VISIBILITY_HIDDEN",
    });

    const victimAttempt = await prisma.evaluationAttempt.findUniqueOrThrow({
      where: { id: victim.attempt.id },
    });
    expect(victimAttempt.scoreOverride).toBeNull();

    // Le comportement légitime doit toujours fonctionner : zérer SA PROPRE tentative.
    // (type différent du précédent pour rester sur une première occurrence ZEROED_QUESTION,
    // la récidive du même type bascule en ZEROED_EVALUATION — cf. lib/integrity/events.ts)
    await recordIntegrityEvent({
      evaluationId: attacker.evaluation.id,
      childId: attacker.child.id,
      evaluationAttemptId: attacker.attempt.id,
      type: "WINDOW_BLUR",
    });
    const attackerAttempt = await prisma.evaluationAttempt.findUniqueOrThrow({
      where: { id: attacker.attempt.id },
    });
    expect(attackerAttempt.scoreOverride).toBe(0);
  });
});
