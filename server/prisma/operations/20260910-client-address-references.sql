BEGIN;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS "personalAddressReference" TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS "businessAddressReference" TEXT;
COMMIT;
