BEGIN;
LOCK TABLE vaults, cash_boxes, cash_sessions, cash_movements IN SHARE ROW EXCLUSIVE MODE;

ALTER TABLE clients ADD COLUMN "referenceName" TEXT;
ALTER TABLE clients ADD COLUMN "referencePhone" TEXT;
ALTER TABLE clients ADD COLUMN "businessRuc" TEXT;
ALTER TABLE clients ADD COLUMN "businessName" TEXT;
ALTER TABLE clients ADD COLUMN "businessPhone" TEXT;
ALTER TABLE clients ADD COLUMN "businessActivity" TEXT;

-- Initialize capital once and reconcile all existing cash transfers.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM vaults WHERE balance <> 0) THEN
    RAISE EXCEPTION 'Vault already has a balance: review capital reconciliation before applying';
  END IF;
END $$;

UPDATE vaults v SET balance = 30000
  - COALESCE((SELECT SUM(cs."openingAmount") FROM cash_sessions cs
      JOIN cash_boxes cb ON cb.id = cs."cashBoxId" WHERE cb."organizationId" = v."organizationId"), 0)
  + COALESCE((SELECT SUM(cs."countedAmount") FROM cash_sessions cs
      JOIN cash_boxes cb ON cb.id = cs."cashBoxId"
      WHERE cb."organizationId" = v."organizationId" AND cs.status = 'CLOSED'), 0)
  - COALESCE((SELECT SUM(CASE WHEN cm.direction = 'IN' THEN cm.amount ELSE -cm.amount END)
      FROM cash_movements cm WHERE cm."vaultId" = v.id
      AND cm.type IN ('WITHDRAWAL_FROM_VAULT', 'DEPOSIT_TO_VAULT')), 0),
  "updatedAt" = now()
WHERE name = 'Boveda principal';

INSERT INTO audit_logs (id, "organizationId", entity, "entityId", action, "before", "after")
SELECT gen_random_uuid(), "organizationId", 'Vault', id::text, 'INITIAL_CAPITAL',
  jsonb_build_object('balance', 0),
  jsonb_build_object('initialCapital', 30000, 'reconciledBalance', balance)
FROM vaults WHERE name = 'Boveda principal';

ALTER TABLE vaults ADD CONSTRAINT vault_balance_nonnegative CHECK (balance >= 0);
CREATE UNIQUE INDEX cash_sessions_one_open_box ON cash_sessions ("cashBoxId") WHERE status = 'OPEN';
CREATE UNIQUE INDEX cash_sessions_one_open_user ON cash_sessions ("userId") WHERE status = 'OPEN';
COMMIT;
