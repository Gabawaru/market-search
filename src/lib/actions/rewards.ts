"use server";

import { redirect } from "next/navigation";
import { getChildSession } from "@/lib/auth/childSession";
import { prisma } from "@/lib/db/prisma";
import { spendPoints, awardPoints, InsufficientPointsError } from "@/lib/progression/points";
import { getStreakFreezeEligibility } from "@/lib/progression/streakFreezeEligibility";
import {
  getMysteryBoxStatus,
  drawMysteryBoxReward,
  mysteryBoxDateKey,
  MYSTERY_BOX_COST,
} from "@/lib/progression/mysteryBox";

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

  if (item.kind === "STREAK_FREEZE") {
    const eligibility = await getStreakFreezeEligibility(session.childId);
    if (!eligibility.eligible) {
      redirect(`/app/rewards?error=${encodeURIComponent(eligibility.reason ?? "Pas encore disponible")}`);
    }
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

export async function openMysteryBox() {
  const session = await getChildSession();
  if (!session) {
    redirect("/child/select-profile");
  }

  const now = new Date();
  const status = await getMysteryBoxStatus(session.childId, now);
  if (!status.eligible) {
    // Déjà ouverte aujourd'hui, ou conditions de déblocage non remplies : refus clair, pas de tirage.
    const reason = status.alreadyOpenedToday
      ? "Tu as déjà ouvert la boîte surprise aujourd'hui — reviens demain !"
      : status.reason ?? "La boîte surprise n'est pas encore débloquée.";
    redirect(`/app/rewards?error=${encodeURIComponent(reason)}`);
  }

  // Le coût est prélevé d'abord ; le tirage rapporte toujours plus que le coût (jamais de perte nette).
  try {
    await spendPoints(session.childId, MYSTERY_BOX_COST, "Ouverture de la boîte surprise");
  } catch (error) {
    if (error instanceof InsufficientPointsError) {
      redirect(
        `/app/rewards?error=${encodeURIComponent(
          `Il te faut ${MYSTERY_BOX_COST} points pour ouvrir la boîte surprise.`,
        )}`,
      );
    }
    throw error;
  }

  const draw = drawMysteryBoxReward(Math.random());

  // L'unicité [childId, date] rend l'opération non contournable : une seule boîte par jour, même en
  // cas de double clic — si la ligne existe déjà on rembourse le coût prélevé et on s'arrête.
  try {
    await prisma.dailyMysteryBox.create({
      data: {
        childId: session.childId,
        date: mysteryBoxDateKey(now),
        rewardPoints: draw.rewardPoints,
        isJackpot: draw.isJackpot,
      },
    });
  } catch {
    await awardPoints(session.childId, "ADJUSTMENT", MYSTERY_BOX_COST, "Remboursement boîte surprise");
    redirect(
      `/app/rewards?error=${encodeURIComponent("Tu as déjà ouvert la boîte surprise aujourd'hui.")}`,
    );
  }

  await awardPoints(
    session.childId,
    "ADJUSTMENT",
    draw.rewardPoints,
    draw.isJackpot ? "JACKPOT de la boîte surprise !" : "Gain de la boîte surprise",
  );

  const params = new URLSearchParams({
    boxReward: String(draw.rewardPoints),
    boxJackpot: draw.isJackpot ? "1" : "0",
  });
  redirect(`/app/rewards?${params.toString()}`);
}
