BEGIN;

-- Sequence values are never reused, including after a rolled-back request.
CREATE SEQUENCE credit_code_seq;
SELECT setval('credit_code_seq', GREATEST(COALESCE((
  SELECT MAX(substring(code FROM '^CRE-([0-9]+)$')::bigint) FROM credits
), 0) + 1, 1), false);

-- DropForeignKey
ALTER TABLE "credit_status_history" DROP CONSTRAINT "credit_status_history_creditId_fkey";

-- DropForeignKey
ALTER TABLE "credits" DROP CONSTRAINT "credits_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_clientId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_creditId_fkey";

-- DropForeignKey
ALTER TABLE "payment_schedules" DROP CONSTRAINT "payment_schedules_creditId_fkey";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "baseAmount" DECIMAL(14,2),
ADD COLUMN     "penaltyAmount" DECIMAL(14,2),
ADD COLUMN     "receiptId" UUID;

-- CreateTable
CREATE TABLE "customer_accounts" (
    "id" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_sessions" (
    "id" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_accounts_clientId_key" ON "customer_accounts"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_accounts_subject_key" ON "customer_accounts"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "customer_sessions_tokenHash_key" ON "customer_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "customer_sessions_accountId_expiresAt_idx" ON "customer_sessions"("accountId", "expiresAt");

-- CreateIndex
CREATE INDEX "payment_receipts_creditId_createdAt_idx" ON "payment_receipts"("creditId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_receipts_userId_createdAt_idx" ON "payment_receipts"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "payments_receiptId_idx" ON "payments"("receiptId");

-- AddForeignKey
ALTER TABLE "customer_accounts" ADD CONSTRAINT "customer_accounts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "customer_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "credits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "payment_receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "credits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_status_history" ADD CONSTRAINT "credit_status_history_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "credits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "credits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE payments ADD CONSTRAINT payments_positive_amount CHECK (amount > 0);
ALTER TABLE payments ADD CONSTRAINT payments_allocation_amounts CHECK (
  ("baseAmount" IS NULL AND "penaltyAmount" IS NULL AND "receiptId" IS NULL)
  OR ("baseAmount" IS NOT NULL AND "penaltyAmount" IS NOT NULL
      AND "baseAmount" >= 0 AND "penaltyAmount" >= 0
      AND "baseAmount" + "penaltyAmount" = amount)
);
ALTER TABLE payment_receipts ADD CONSTRAINT receipts_positive_amount CHECK (amount > 0);
ALTER TABLE credits ADD CONSTRAINT credits_positive_terms CHECK (
  "principalAmount" > 0 AND "installmentCount" > 0 AND "interestRate" >= 0
);
ALTER TABLE payment_schedules ADD CONSTRAINT schedules_nonnegative_amounts CHECK (
  principal >= 0 AND interest >= 0 AND penalty >= 0 AND "paidAmount" >= 0
  AND "penaltyPaid" >= 0 AND "penaltyPaid" <= "paidAmount" AND "penaltyAccruedDays" >= 0
);

COMMIT;
