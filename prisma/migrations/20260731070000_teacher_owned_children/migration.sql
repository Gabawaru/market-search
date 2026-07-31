-- AlterTable
ALTER TABLE "Child" ALTER COLUMN "parentId" DROP NOT NULL,
ADD COLUMN     "teacherId" TEXT;

-- CreateIndex
CREATE INDEX "Child_teacherId_idx" ON "Child"("teacherId");

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
