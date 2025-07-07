-- CreateTable
CREATE TABLE "login_records" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_name" VARCHAR(50) NOT NULL,
    "login_ip" VARCHAR(50) NOT NULL,
    "user_agent" TEXT,
    "login_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "login_result" VARCHAR(20) NOT NULL DEFAULT 'success',
    "location" VARCHAR(100),

    CONSTRAINT "login_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_records_user_id_idx" ON "login_records"("user_id");

-- CreateIndex
CREATE INDEX "login_records_login_time_idx" ON "login_records"("login_time");

-- AddForeignKey
ALTER TABLE "login_records" ADD CONSTRAINT "login_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
