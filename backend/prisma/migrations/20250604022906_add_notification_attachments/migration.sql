-- CreateTable
CREATE TABLE "notification_attachments" (
    "id" SERIAL NOT NULL,
    "notification_id" INTEGER NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255),
    "file_type" VARCHAR(50) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "uploader_id" INTEGER NOT NULL,
    "upload_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "notification_attachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notification_attachments" ADD CONSTRAINT "notification_attachments_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_attachments" ADD CONSTRAINT "notification_attachments_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
