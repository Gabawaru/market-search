import { prisma } from "@/lib/db/prisma";
import { decideIntegrityAction } from "@/lib/integrity/events";
import type { IntegrityEventType, Prisma } from "@/generated/prisma/client";

export interface RecordIntegrityEventParams {
  evaluationId: string;
  childId: string;
  evaluationAttemptId?: string;
  type: IntegrityEventType;
  clientTimestamp?: Date;
  metadata?: Prisma.InputJsonObject;
}

/** Source de vérité serveur : recalcule toujours la décision, n'accepte jamais un
 * verdict envoyé par le client. */
export async function recordIntegrityEvent(params: RecordIntegrityEventParams) {
  const priorOccurrences = await prisma.integrityEvent.count({
    where: { evaluationId: params.evaluationId, type: params.type },
  });

  const { severity, action } = decideIntegrityAction(params.type, priorOccurrences);

  await prisma.integrityEvent.create({
    data: {
      evaluationId: params.evaluationId,
      childId: params.childId,
      evaluationAttemptId: params.evaluationAttemptId,
      type: params.type,
      severity,
      actionTaken: action,
      metadata: params.metadata,
      clientTimestamp: params.clientTimestamp,
    },
  });

  if (action === "ZEROED_QUESTION" && params.evaluationAttemptId) {
    await prisma.evaluationAttempt.update({
      where: { id: params.evaluationAttemptId },
      data: { scoreOverride: 0 },
    });
  }

  if (action === "ZEROED_EVALUATION") {
    await prisma.evaluation.update({
      where: { id: params.evaluationId },
      data: {
        status: "INVALIDATED",
        invalidReason: `Anomalie détectée pendant l'évaluation : ${params.type}`,
      },
    });
  }

  return { severity, action };
}
