import { prisma } from "@/lib/db/prisma";
import type { PointsTransactionType } from "@/generated/prisma/client";

export async function getOrCreateWallet(childId: string) {
  const existing = await prisma.pointsWallet.findUnique({ where: { childId } });
  if (existing) return existing;
  return prisma.pointsWallet.create({ data: { childId } });
}

export async function awardPoints(
  childId: string,
  type: PointsTransactionType,
  amount: number,
  reason: string,
) {
  const wallet = await getOrCreateWallet(childId);
  await prisma.pointsTransaction.create({ data: { walletId: wallet.id, type, amount, reason } });
  await prisma.pointsWallet.update({
    where: { id: wallet.id },
    data: {
      balance: { increment: amount },
      ...(amount > 0 ? { lifetimeEarned: { increment: amount } } : {}),
    },
  });
}

export class InsufficientPointsError extends Error {}

export async function spendPoints(childId: string, amount: number, reason: string) {
  const wallet = await getOrCreateWallet(childId);
  if (wallet.balance < amount) {
    throw new InsufficientPointsError("Solde de points insuffisant");
  }
  await prisma.pointsTransaction.create({
    data: { walletId: wallet.id, type: "SPENT_REWARD", amount: -amount, reason },
  });
  await prisma.pointsWallet.update({
    where: { id: wallet.id },
    data: { balance: { decrement: amount } },
  });
}
