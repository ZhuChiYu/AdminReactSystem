-- CreateTable
CREATE TABLE "customer_assignments" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "assigned_to_id" INTEGER NOT NULL,
    "assigned_by_id" INTEGER NOT NULL,
    "assigned_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" INTEGER NOT NULL DEFAULT 1,
    "remark" TEXT,

    CONSTRAINT "customer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_assignments_customer_id_assigned_to_id_key" ON "customer_assignments"("customer_id", "assigned_to_id");

-- AddForeignKey
ALTER TABLE "customer_assignments" ADD CONSTRAINT "customer_assignments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_assignments" ADD CONSTRAINT "customer_assignments_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_assignments" ADD CONSTRAINT "customer_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
