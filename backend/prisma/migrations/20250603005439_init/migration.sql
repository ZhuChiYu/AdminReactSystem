-- CreateTable
CREATE TABLE "expense_applications" (
    "id" SERIAL NOT NULL,
    "application_no" VARCHAR(50) NOT NULL,
    "applicant_id" INTEGER NOT NULL,
    "expense_type" VARCHAR(100) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "application_reason" TEXT,
    "expense_period_start" TIMESTAMP(3),
    "expense_period_end" TIMESTAMP(3),
    "remark" TEXT,
    "application_status" INTEGER NOT NULL DEFAULT 0,
    "current_approver_id" INTEGER,
    "approval_time" TIMESTAMP(3),
    "approval_comment" TEXT,
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_items" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "item_name" VARCHAR(200) NOT NULL,
    "item_type" VARCHAR(100) NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "receipt_no" VARCHAR(100),
    "vendor" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expense_applications_application_no_key" ON "expense_applications"("application_no");

-- AddForeignKey
ALTER TABLE "expense_applications" ADD CONSTRAINT "expense_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_applications" ADD CONSTRAINT "expense_applications_current_approver_id_fkey" FOREIGN KEY ("current_approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "expense_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
