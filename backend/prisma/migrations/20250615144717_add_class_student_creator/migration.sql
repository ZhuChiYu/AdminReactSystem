-- AlterTable
ALTER TABLE "class_students" ADD COLUMN     "created_by_id" INTEGER;

-- AddForeignKey
ALTER TABLE "class_students" ADD CONSTRAINT "class_students_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
