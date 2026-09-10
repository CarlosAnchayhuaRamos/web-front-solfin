# Cash capital and customer details

Apply `prisma/operations/20260910-cash-clients.sql` once, coordinated with
deployment of the updated cash service. Do not operate the old cash service
after reconciliation: it does not debit or credit the vault.

Initial capital is PEN 30,000. Historical openings are subtracted and counted
closings added. Existing vault transfers are included. The script refuses an
already funded vault and rolls back on invalid balances or duplicate open
sessions. INITIAL_CAPITAL in AuditLog preserves the reconciliation amount.

Opening a cash box and adding cash withdraw from the vault. Closing returns
counted cash, including any permitted shortage or surplus. Collection and
disbursement affect the cash box immediately and reach the vault when cash is
returned. Opening or closing the vault only changes operating status.

Vault row locks precede cash-session locks. Collection and disbursement retain
their cash-session locks. Unique partial indexes permit one open session per
box and per cashier. Cash audits identify the authenticated operator.

Birth dates use DD-MM-YYYY in the client form and table, ISO YYYY-MM-DD in
API payloads. Optional reference and business fields are preserved on editing.
Region uses the existing department column. Exclusive status no longer reveals
a rate input; existing special rate configuration is unchanged.

New daily simulations use 26 collectible days per interest month. Daily due
dates start after disbursement and skip Sundays. Monthly and weekly calculations
are unchanged; existing active schedules and amounts are not migrated. Penalty
days remain calendar days under the existing terms.
