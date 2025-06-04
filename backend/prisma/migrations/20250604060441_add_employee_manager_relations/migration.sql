-- CreateTable
CREATE TABLE "employee_manager_relations" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "manager_id" INTEGER NOT NULL,
    "assigned_by_id" INTEGER NOT NULL,
    "assigned_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" INTEGER NOT NULL DEFAULT 1,
    "remark" TEXT,

    CONSTRAINT "employee_manager_relations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_manager_relations_employee_id_manager_id_key" ON "employee_manager_relations"("employee_id", "manager_id");

-- AddForeignKey
ALTER TABLE "employee_manager_relations" ADD CONSTRAINT "employee_manager_relations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_manager_relations" ADD CONSTRAINT "employee_manager_relations_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_manager_relations" ADD CONSTRAINT "employee_manager_relations_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
