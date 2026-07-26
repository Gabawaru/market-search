"use server";

import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { spendPoints, InsufficientPointsError } from "@/lib/progression/points";

export async function redeemReward(formData: FormData) {
  const session = await getChildSession();
  if (!session) {
    redirect("/child/select-profile");
  }

  const itemId = formData.get("itemId");
  if (typeof itemId !== "string") {
    redirect("/app/rewards");
  }

  const item = await prisma.rewardCatalogItem.findUnique({ where: { id: itemId } });
  if (!item || !item.active) {
    redirect(`/app/rewards?error=${encodeURIComponent("Récompense introuvable")}`);
  }

  try {
    await spendPoints(session.childId, item.cost, `Échange : ${item.label}`);
  } catch (error) {
    if (error instanceof InsufficientPointsError) {
      redirect(`/app/rewards?error=${encodeURIComponent("Pas assez de points pour cette récompense")}`);
    }
    throw error;
  }

  await prisma.rewardRedemption.create({
    data: { childId: session.childId, itemId: item.id },
  });

  redirect(`/app/rewards?success=${encodeURIComponent(`${item.label} débloqué !`)}`);
}
