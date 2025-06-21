-- CreateTable
CREATE TABLE "employee_targets" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "target_year" INTEGER NOT NULL,
    "target_month" INTEGER NOT NULL,
    "target_amount" DECIMAL(12,2) NOT NULL,
    "manager_id" INTEGER NOT NULL,
    "remark" TEXT,
    "status" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_targets_employee_id_target_year_target_month_key" ON "employee_targets"("employee_id", "target_year", "target_month");

-- AddForeignKey
ALTER TABLE "employee_targets" ADD CONSTRAINT "employee_targets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_targets" ADD CONSTRAINT "employee_targets_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
