# Credit safety rollout

## Database

Apply `prisma/operations/20260909-credit-safety.sql` before deploying this code.
It adds columns and receipts without dropping data. It aborts if any existing
credit has no reviewed penalty terms. Do not populate historical contracts from
current policy without verifying the signed conditions.

For historical partial payments, reconstruct `penalty`, `penaltyPaid` and
`penaltyAccruedDays` from payment dates and the agreed allocation rule before
enabling collections. `paidAmount` remains total cash paid, including penalties.
`penalty` is cumulative accrued mora, not outstanding mora. No migration has
been executed against production as part of these changes.

Current allocation preserves the previous application behavior: each installment's
base amount first, then its mora, before moving to the next installment. Capped
simple mora uses the original installment amount as the lifetime cap base.
Accrued mora is preserved after partial payments. Conditions are stored on credit
creation; subsequent policy edits affect only new credits.

Documents must be generated for today's Lima date before disbursement. Generating
the first document updates due dates and invalidates earlier-day confirmations.
This records document generation, not a signature or proof of physical printing.

## Attachments

Uploads accept PDF, JPEG and PNG, at most 5 MB per file. Files are downloaded through
authenticated API requests; their storage keys are never public links.

For S3 or compatible storage, configure:

- `STORAGE_PROVIDER=S3`
- `S3_BUCKET`
- `AWS_REGION` (for example `us-east-1`, or provider-specific region)
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` via the deployment secret store
- `S3_ENDPOINT` for a compatible provider
- `S3_FORCE_PATH_STYLE=true` only when required by the provider

Use a private bucket. Implementation uses the official
[AWS S3 SDK](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html).

For a persistent disk, configure `STORAGE_PROVIDER=LOCAL` and the absolute mounted
directory in `STORAGE_LOCAL_DIRECTORY`. Local development defaults to `.uploads`.
Production rejects local uploads without an explicit absolute directory. Ensure
the configured directory is a persistent mount, not the service's temporary disk.
Keep the provider and bucket stable for existing attachments.

Bootstrap creates an administrator only when the user table is empty. Restarting
the API cannot reset passwords or reactivate a configured account. Remove bootstrap
credentials from production once accounts have been provisioned.

## Verification

`npm run test:server` loads TypeScript source directly. No build is required.
Run backend and frontend `tsc --noEmit` for type checks.
Mocked transaction tests do not replace PostgreSQL concurrency testing. Test
simultaneous payments, payment retries and closing cash during a payment against
an isolated PostgreSQL database before production rollout.
