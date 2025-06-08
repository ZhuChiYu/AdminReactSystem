/*
  Warnings:

  - The `create_time` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `update_time` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "create_time",
ADD COLUMN     "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "update_time",
ADD COLUMN     "update_time" TIMESTAMP(3);
