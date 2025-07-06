/*
  Warnings:

  - A unique constraint covering the columns `[employee_id,target_year,target_type,target_month,target_week]` on the table `employee_targets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `target_type` to the `employee_targets` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "employee_targets_employee_id_target_year_target_month_key";

-- AlterTable
ALTER TABLE "employee_targets" ADD COLUMN     "target_type" VARCHAR(10) NOT NULL,
ADD COLUMN     "target_week" INTEGER,
ALTER COLUMN "target_month" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "employee_targets_employee_id_target_year_target_type_target_key" ON "employee_targets"("employee_id", "target_year", "target_type", "target_month", "target_week");
