-- AlterTable: l'email n'est plus obligatoire pour un compte parent (inscription possible via
-- identifiant seul, email ajoutable plus tard)
ALTER TABLE "Parent" ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable: ajoute username, nullable dans un premier temps le temps de le renseigner pour les
-- lignes déjà existantes
ALTER TABLE "Parent" ADD COLUMN "username" TEXT;
ALTER TABLE "Teacher" ADD COLUMN "username" TEXT;

-- Backfill des comptes déjà en base (identifiant technique basé sur l'id, garanti unique) — les
-- comptes existants continuent de se connecter par email comme avant, ce backfill ne fait que
-- satisfaire la contrainte NOT NULL/UNIQUE ci-dessous.
UPDATE "Parent" SET "username" = 'user_' || "id" WHERE "username" IS NULL;
UPDATE "Teacher" SET "username" = 'user_' || "id" WHERE "username" IS NULL;

ALTER TABLE "Parent" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "Teacher" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Parent_username_key" ON "Parent"("username");
CREATE UNIQUE INDEX "Teacher_username_key" ON "Teacher"("username");

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "teacherId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_parentId_idx" ON "PasswordResetToken"("parentId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_teacherId_idx" ON "PasswordResetToken"("teacherId");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
