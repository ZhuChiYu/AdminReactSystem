/*
  Warnings:

  - You are about to drop the column `rating` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `review_count` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the `course_reviews` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "course_reviews" DROP CONSTRAINT "course_reviews_course_id_fkey";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "rating",
DROP COLUMN "review_count";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" VARCHAR(500),
ADD COLUMN     "bank_card" VARCHAR(50),
ADD COLUMN     "contract_end_date" TIMESTAMP(3),
ADD COLUMN     "contract_start_date" TIMESTAMP(3),
ADD COLUMN     "contract_years" INTEGER,
ADD COLUMN     "id_card" VARCHAR(18),
ADD COLUMN     "tim" VARCHAR(100),
ADD COLUMN     "wechat" VARCHAR(100);

-- DropTable
DROP TABLE "course_reviews";

-- CreateTable
CREATE TABLE "attachments" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255),
    "file_type" VARCHAR(50) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploader_id" INTEGER NOT NULL,
    "upload_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category_id" INTEGER NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,
    "teacher" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "student_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_students" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "company" VARCHAR(200) NOT NULL,
    "position" VARCHAR(100),
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "join_date" TIMESTAMP(3) NOT NULL,
    "attendance_rate" INTEGER NOT NULL DEFAULT 100,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "read_status" INTEGER NOT NULL DEFAULT 0,
    "read_time" TEXT,
    "related_id" INTEGER,
    "related_type" VARCHAR(50),
    "create_time" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "task_name" VARCHAR(200) NOT NULL,
    "task_desc" TEXT,
    "project_name" VARCHAR(200) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "target_count" INTEGER NOT NULL DEFAULT 0,
    "actual_count" INTEGER NOT NULL DEFAULT 0,
    "assignee_id" INTEGER NOT NULL,
    "task_type" VARCHAR(50) NOT NULL DEFAULT 'normal',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "task_status" INTEGER NOT NULL DEFAULT 0,
    "remark" TEXT,
    "create_time" TEXT NOT NULL,
    "update_time" TEXT,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_students" ADD CONSTRAINT "class_students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
