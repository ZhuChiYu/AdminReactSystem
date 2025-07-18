-- CreateTable
CREATE TABLE "user_notification_read_statuses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "notification_id" INTEGER NOT NULL,
    "read_status" INTEGER NOT NULL DEFAULT 0,
    "read_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notification_read_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_read_statuses_user_id_notification_id_key" ON "user_notification_read_statuses"("user_id", "notification_id");

-- AddForeignKey
ALTER TABLE "user_notification_read_statuses" ADD CONSTRAINT "user_notification_read_statuses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_read_statuses" ADD CONSTRAINT "user_notification_read_statuses_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
