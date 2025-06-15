/*
  Warnings:

  - You are about to drop the `tasks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "customers" DROP CONSTRAINT "customers_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assignee_id_fkey";

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "created_by_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "department" VARCHAR(100);

-- DropTable
DROP TABLE "tasks";

-- CreateTable
CREATE TABLE "task" (
    "id" SERIAL NOT NULL,
    "project_type" VARCHAR(100) NOT NULL,
    "project_name" VARCHAR(200) NOT NULL,
    "current_stage" VARCHAR(50) NOT NULL,
    "stage_history" JSONB,
    "responsible_person_id" INTEGER NOT NULL,
    "executor_id" INTEGER,
    "consultant_id" INTEGER,
    "market_manager_id" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "remark" TEXT,
    "proposal_attachments" JSONB,
    "proposal_upload_time" TIMESTAMP(3),
    "proposal_comment" TEXT,
    "customer_approval_time" TIMESTAMP(3),
    "customer_approval_comment" TEXT,
    "teacher_info" JSONB,
    "teacher_confirm_time" TIMESTAMP(3),
    "teacher_confirm_comment" TEXT,
    "approval_time" TIMESTAMP(3),
    "approval_comment" TEXT,
    "contract_sign_time" TIMESTAMP(3),
    "contract_sign_comment" TEXT,
    "project_completion_time" TIMESTAMP(3),
    "project_completion_comment" TEXT,
    "payment_time" TIMESTAMP(3),
    "payment_comment" TEXT,
    "payment_amount" DECIMAL(10,2),
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completion_time" TIMESTAMP(3),
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archive_time" TIMESTAMP(3),
    "create_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_attachments" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255),
    "file_type" VARCHAR(50) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploader_id" INTEGER NOT NULL,
    "upload_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,
    "description" VARCHAR(500),
    "stage" VARCHAR(50),

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_executor_id_fkey" FOREIGN KEY ("executor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_market_manager_id_fkey" FOREIGN KEY ("market_manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_responsible_person_id_fkey" FOREIGN KEY ("responsible_person_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
