-- AlterTable
ALTER TABLE "TeacherExercise" ADD COLUMN     "documentData" BYTEA,
ADD COLUMN     "documentFileName" TEXT,
ADD COLUMN     "documentMimeType" TEXT;
