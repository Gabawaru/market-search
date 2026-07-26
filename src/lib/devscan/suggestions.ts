import { prisma } from "@/lib/db/prisma";
import type { DevSuggestionCategory, Prisma } from "@/generated/prisma/client";

/** Point d'entrée utilisé par le scan IA (Routine Claude, phase 8) pour proposer une
 * amélioration — jamais appliquée automatiquement pour du contenu/code arbitraire, toujours
 * en attente de validation dans l'espace développeur (sauf règle de contenu déjà validée,
 * gérée séparément). */
export function createDevSuggestion(params: {
  category: DevSuggestionCategory;
  title: string;
  description: string;
  sourceData?: Prisma.InputJsonObject;
}) {
  return prisma.devSuggestion.create({
    data: {
      category: params.category,
      title: params.title,
      description: params.description,
      sourceData: params.sourceData,
    },
  });
}
