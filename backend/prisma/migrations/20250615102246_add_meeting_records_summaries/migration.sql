-- CreateTable
CREATE TABLE "meeting_records" (
    "id" SERIAL NOT NULL,
    "meeting_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "key_points" TEXT,
    "action_items" TEXT,
    "decisions" TEXT,
    "next_steps" TEXT,
    "recorder_id" INTEGER NOT NULL,
    "record_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_summaries" (
    "id" SERIAL NOT NULL,
    "meeting_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "conclusion" TEXT,
    "next_steps" TEXT,
    "participants" JSONB,
    "tags" JSONB,
    "creator_id" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_summaries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "meeting_records" ADD CONSTRAINT "meeting_records_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_records" ADD CONSTRAINT "meeting_records_recorder_id_fkey" FOREIGN KEY ("recorder_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_summaries" ADD CONSTRAINT "meeting_summaries_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_summaries" ADD CONSTRAINT "meeting_summaries_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
