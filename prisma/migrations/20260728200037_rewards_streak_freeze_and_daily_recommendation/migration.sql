-- CreateEnum
CREATE TYPE "RewardCatalogItemKind" AS ENUM ('COSMETIC', 'STREAK_FREEZE');

-- AlterTable
ALTER TABLE "RewardCatalogItem" ADD COLUMN     "kind" "RewardCatalogItemKind" NOT NULL DEFAULT 'COSMETIC';

-- AlterTable
ALTER TABLE "RewardRedemption" ADD COLUMN     "consumedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DailyRecommendation" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyRecommendation_childId_date_key" ON "DailyRecommendation"("childId", "date");

-- AddForeignKey
ALTER TABLE "DailyRecommendation" ADD CONSTRAINT "DailyRecommendation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRecommendation" ADD CONSTRAINT "DailyRecommendation_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
