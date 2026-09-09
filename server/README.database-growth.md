# SOLFIN database growth

Scope: one company, cash collections at a staffed cash box, no branches.

## Migration

Apply `prisma/operations/20260909-growth.sql` once, before deploying the new
server. It runs in one transaction and preserves historical rows. It fails
and rolls back if orphaned receipts or invalid financial amounts exist.
Do not replace this script with `prisma db push`: the sequence and SQL CHECK
constraints are not represented by Prisma's schema.

Credit codes use a PostgreSQL sequence initialized above existing CRE codes.
Rollback can leave gaps; credit codes are identifiers, not fiscal receipt numbers.

## Cash payments

One PaymentReceipt groups Payment rows, each applied to a PaymentSchedule.
New rows store baseAmount (principal plus interest) and penaltyAmount. This
preserves the agreed base-first rule without introducing an unapproved priority
between principal and interest. Historical components and receipt links remain
null where they cannot be reliably reconstructed.

Credit creation, disbursement and cash collection write AuditLog in the same
transaction. Repeated collection request IDs return the original receipt.
Credit, schedule, history and document foreign keys restrict destructive deletes.
These controls do not yet constitute a full accounting ledger or immutable audit
storage against database administrators.

## Clients

GET /clients/page?page=1&name=&dni= serves 25 clients, with server-side filters
and SQL aggregation. The clients screen uses it. GET /clients remains compatible
with existing credit-form selectors; those selectors still load the full list.
The clients list no longer seeds demo clients when empty.

## Future portal

CustomerAccount and CustomerSession are separate from employee AppUser.
Accounts default inactive. subject holds an external identity identifier;
session storage holds token hashes only, never raw bearer tokens.
No customer login or public portal endpoints are enabled by this migration.
When implementing them, require verified identity, active account, unrevoked
session, and ownership checks through account.clientId for every resource.
Client operations do not record a cash collection; only the cashier does.

Contract-file versioning, signed evidence, refinancing schedules and accounting
reversals remain future workflows, not implied by these schema changes.
