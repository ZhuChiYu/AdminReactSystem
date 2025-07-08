-- CreateTable
CREATE TABLE "customer_status_history" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "old_status" VARCHAR(50),
    "new_status" VARCHAR(50) NOT NULL,
    "change_reason" TEXT,
    "operator_id" INTEGER NOT NULL,
    "operator_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_status_history_customer_id_idx" ON "customer_status_history"("customer_id");

-- CreateIndex
CREATE INDEX "customer_status_history_created_at_idx" ON "customer_status_history"("created_at");

-- AddForeignKey
ALTER TABLE "customer_status_history" ADD CONSTRAINT "customer_status_history_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_status_history" ADD CONSTRAINT "customer_status_history_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
