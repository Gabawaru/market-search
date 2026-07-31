import { prisma } from "@/lib/db/prisma";

export const HELP_REQUEST_NOTIFICATION_TYPE = "HELP_REQUEST";

/** Trois erreurs d'affilée : assez pour signaler un vrai blocage, assez peu pour proposer de
 * l'aide avant que l'enfant ne se décourage. */
export const HELP_OFFER_CONSECUTIVE_INCORRECT = 3;

/** `attempts` est ordonné de la tentative la plus récente à la plus ancienne. */
export function countTrailingIncorrect(attempts: { isCorrect: boolean }[]): number {
  let count = 0;
  for (const attempt of attempts) {
    if (attempt.isCorrect) break;
    count += 1;
  }
  return count;
}

export function shouldOfferHelp(consecutiveIncorrect: number): boolean {
  return consecutiveIncorrect >= HELP_OFFER_CONSECUTIVE_INCORRECT;
}

export interface HelpRequestPayload {
  childId: string;
  skillId: string;
  skillName: string;
}

function readPayload(payload: unknown): HelpRequestPayload | null {
  if (!payload || typeof payload !== "object") return null;
  const { childId, skillId, skillName } = payload as Record<string, unknown>;
  if (typeof childId !== "string" || typeof skillId !== "string" || typeof skillName !== "string") {
    return null;
  }
  return { childId, skillId, skillName };
}

// Le filtrage se fait en mémoire plutôt qu'en JSON path SQL : le volume est minuscule (demandes
// non lues d'un seul parent) et on ne dépend d'aucune sémantique JSON propre au provider.
// parentId peut être null (enfant créé directement par un prof, sans parent) — aucune demande
// d'aide possible dans ce cas, il n'y a personne à qui l'adresser.
async function listUnreadHelpRequests(parentId: string | null) {
  if (!parentId) return [];
  const notifications = await prisma.notification.findMany({
    where: { parentId, type: HELP_REQUEST_NOTIFICATION_TYPE, readAt: null },
    orderBy: { createdAt: "desc" },
  });

  return notifications.flatMap((notification) => {
    const payload = readPayload(notification.payload);
    return payload ? [{ id: notification.id, createdAt: notification.createdAt, ...payload }] : [];
  });
}

export async function listPendingHelpRequestsForChild(parentId: string | null, childId: string) {
  const requests = await listUnreadHelpRequests(parentId);
  return requests.filter((request) => request.childId === childId);
}

export async function hasPendingHelpRequest(
  parentId: string | null,
  childId: string,
  skillId: string,
): Promise<boolean> {
  const requests = await listPendingHelpRequestsForChild(parentId, childId);
  return requests.some((request) => request.skillId === skillId);
}

/** Ne crée rien si une demande sur la même compétence est déjà en attente — un enfant qui
 * appuie plusieurs fois ne doit pas noyer ses parents sous les notifications. Ne crée rien non
 * plus si l'enfant n'a pas de parent (profil créé directement par un prof, voir Child.teacherId)
 * — il n'y a alors personne à notifier ; le prof voit déjà le signal via
 * listStrugglingChildrenForTeacher. */
export async function createHelpRequest(params: {
  parentId: string | null;
  childId: string;
  skillId: string;
  skillName: string;
}) {
  if (!params.parentId) return null;

  const alreadyPending = await hasPendingHelpRequest(
    params.parentId,
    params.childId,
    params.skillId,
  );
  if (alreadyPending) return null;

  return prisma.notification.create({
    data: {
      parentId: params.parentId,
      type: HELP_REQUEST_NOTIFICATION_TYPE,
      payload: {
        childId: params.childId,
        skillId: params.skillId,
        skillName: params.skillName,
      },
    },
  });
}
