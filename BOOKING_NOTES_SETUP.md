# Preview setup: internal notes and unverified evidence

This guide is for the `feature/internal-booking-notes` branch and the Cloudflare **Preview** environment only.

## Scope

- `booking_admin_notes` stores internal staff notes linked to an existing record.
- `booking_payment_evidence` stores customer-reported metadata only.
- Every evidence row is constrained to `received_unverified`.
- These tables do not verify or approve payment and do not issue admission credentials.

## Before applying migrations

1. Confirm the Cloudflare Pages deployment is a Preview deployment for this branch.
2. Confirm the selected D1 database is the Preview database, not Production.
3. Export a backup of the Preview D1 database before changing its schema.
4. Review the SQL files:
   - `migrations/0004_booking_admin_notes.sql`
   - `migrations/0005_booking_payment_evidence.sql`

## Apply to Preview only

Run the two migration files against the Preview D1 database, in order (0004, then 0005), using the Cloudflare D1 console or Wrangler with the Preview database target explicitly selected. Do not run these commands against Production.

After applying, verify that the tables exist:

```sql
SELECT name
FROM sqlite_master
WHERE type = 'table'
  AND name IN ('booking_admin_notes', 'booking_payment_evidence')
ORDER BY name;
```

Expected: both table names are returned.

Verify the evidence-state constraint with a synthetic test row only, then remove that synthetic row after testing. Do not use real customer banking details or real transaction references in test data.

## API behavior

- `GET /api/booking-notes?bookingId=<id>` lists internal notes for an existing record.
- `POST /api/booking-notes` adds a note to an existing record.
- `GET /api/booking-payment-evidence?bookingId=<id>` lists internal metadata records.
- `POST /api/booking-payment-evidence` records customer-reported metadata with state `received_unverified`.

All endpoints require the configured admin bearer token. Never paste the token into chat, source control, screenshots, or test fixtures intended for production.

## Test checklist

- Unauthenticated requests return HTTP 401.
- Invalid or oversized input is rejected.
- Unknown record IDs cannot receive notes or evidence metadata.
- Evidence records always remain `received_unverified`.
- Database errors return a generic error without exposing internal details.
- Existing Preview records remain unchanged.

## Production boundary

Do not apply these migrations to Production as part of this Preview test. Production rollout requires a separate review, a verified backup, and explicit approval.