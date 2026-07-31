-- CreateEnum
CREATE TYPE "CuratedExerciseSourceType" AS ENUM ('OFFICIAL_OPEN_SOURCE', 'INSPIRED_BY_SOURCE');

-- CreateEnum
CREATE TYPE "CuratedExerciseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'DOCUMENT', 'AI_PAGE');

-- CreateTable
CREATE TABLE "CuratedExercise" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "sourceType" "CuratedExerciseSourceType" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceLicense" TEXT NOT NULL,
    "status" "CuratedExerciseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "CuratedExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuratedExerciseAttempt" (
    "id" TEXT NOT NULL,
    "curatedExerciseId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "answerGiven" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuratedExerciseAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "LessonType" NOT NULL,
    "videoUrl" TEXT,
    "documentData" BYTEA,
    "documentMimeType" TEXT,
    "documentFileName" TEXT,
    "contentMarkdown" TEXT,
    "contentSourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CuratedExercise_levelId_idx" ON "CuratedExercise"("levelId");

-- CreateIndex
CREATE INDEX "CuratedExercise_status_idx" ON "CuratedExercise"("status");

-- CreateIndex
CREATE INDEX "CuratedExerciseAttempt_curatedExerciseId_idx" ON "CuratedExerciseAttempt"("curatedExerciseId");

-- CreateIndex
CREATE INDEX "CuratedExerciseAttempt_childId_idx" ON "CuratedExerciseAttempt"("childId");

-- CreateIndex
CREATE INDEX "Lesson_levelId_idx" ON "Lesson"("levelId");

-- AddForeignKey
ALTER TABLE "CuratedExercise" ADD CONSTRAINT "CuratedExercise_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuratedExerciseAttempt" ADD CONSTRAINT "CuratedExerciseAttempt_curatedExerciseId_fkey" FOREIGN KEY ("curatedExerciseId") REFERENCES "CuratedExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuratedExerciseAttempt" ADD CONSTRAINT "CuratedExerciseAttempt_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;
