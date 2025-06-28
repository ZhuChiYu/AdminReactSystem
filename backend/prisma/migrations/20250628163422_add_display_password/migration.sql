/*
  Warnings:

  - You are about to drop the column `target_amount` on the `employee_targets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employee_targets" DROP COLUMN "target_amount",
ADD COLUMN     "consult_target" INTEGER DEFAULT 0,
ADD COLUMN     "develop_target" INTEGER DEFAULT 0,
ADD COLUMN     "follow_up_target" INTEGER DEFAULT 0,
ADD COLUMN     "register_target" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "can_create_class" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "display_password" VARCHAR(255);
