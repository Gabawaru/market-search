-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "gradeLevel" TEXT;

-- CreateEnum
CREATE TYPE "TeacherExerciseStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "TeacherExercise" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "referenceAnswer" TEXT,
    "pointsRequired" INTEGER NOT NULL DEFAULT 0,
    "status" "TeacherExerciseStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherExercise_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "TeacherExerciseSubmissionStatus" AS ENUM ('PENDING', 'GRADED');

-- CreateTable
CREATE TABLE "TeacherExerciseSubmission" (
    "id" TEXT NOT NULL,
    "teacherExerciseId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "status" "TeacherExerciseSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "isCorrect" BOOLEAN,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherExerciseSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherExercise_teacherId_idx" ON "TeacherExercise"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherExercise_levelId_idx" ON "TeacherExercise"("levelId");

-- CreateIndex
CREATE INDEX "TeacherExerciseSubmission_teacherExerciseId_idx" ON "TeacherExerciseSubmission"("teacherExerciseId");

-- CreateIndex
CREATE INDEX "TeacherExerciseSubmission_childId_idx" ON "TeacherExerciseSubmission"("childId");

-- AddForeignKey
ALTER TABLE "TeacherExercise" ADD CONSTRAINT "TeacherExercise_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherExercise" ADD CONSTRAINT "TeacherExercise_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherExerciseSubmission" ADD CONSTRAINT "TeacherExerciseSubmission_teacherExerciseId_fkey" FOREIGN KEY ("teacherExerciseId") REFERENCES "TeacherExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherExerciseSubmission" ADD CONSTRAINT "TeacherExerciseSubmission_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
