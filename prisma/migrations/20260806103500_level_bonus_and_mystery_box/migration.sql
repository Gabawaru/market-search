-- CreateTable
CREATE TABLE "LevelCompletionBonus" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LevelCompletionBonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMysteryBox" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "rewardPoints" INTEGER NOT NULL,
    "isJackpot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyMysteryBox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LevelCompletionBonus_childId_idx" ON "LevelCompletionBonus"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "LevelCompletionBonus_childId_levelId_key" ON "LevelCompletionBonus"("childId", "levelId");

-- CreateIndex
CREATE INDEX "DailyMysteryBox_childId_idx" ON "DailyMysteryBox"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMysteryBox_childId_date_key" ON "DailyMysteryBox"("childId", "date");

-- AddForeignKey
ALTER TABLE "LevelCompletionBonus" ADD CONSTRAINT "LevelCompletionBonus_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelCompletionBonus" ADD CONSTRAINT "LevelCompletionBonus_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMysteryBox" ADD CONSTRAINT "DailyMysteryBox_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
