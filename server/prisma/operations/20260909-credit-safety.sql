BEGIN;

ALTER TABLE credits ADD COLUMN IF NOT EXISTS "penaltyTerms" JSONB;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS "documentDate" DATE;
ALTER TABLE credits ADD COLUMN IF NOT EXISTS "generatedDocuments" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE payment_schedules ADD COLUMN IF NOT EXISTS "penaltyPaid" DECIMAL(14,2) NOT NULL DEFAULT 0;
ALTER TABLE payment_schedules ADD COLUMN IF NOT EXISTS "penaltyAccruedDays" INTEGER NOT NULL DEFAULT 0;

-- Historical contracts cannot be inferred from today's parameters.
-- Abort the entire migration until their original conditions have been reviewed.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM credits WHERE "penaltyTerms" IS NULL) THEN
    RAISE EXCEPTION 'Existing credits need reviewed penalty terms and payment history before this migration';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID PRIMARY KEY,
  "creditId" UUID NOT NULL,
  "userId" TEXT NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  voucher JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
