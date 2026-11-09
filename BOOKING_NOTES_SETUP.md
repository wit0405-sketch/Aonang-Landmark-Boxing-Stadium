# Internal Booking Notes API

This feature is for internal administrative recordkeeping only. A note is not proof of payment, a booking approval, an admission ticket, or permission to enter an event.

## Prerequisites

- Cloudflare Pages Functions deployment.
- A **separate D1 Preview database** for testing. Do not point the Preview environment at the production database.
- Preview D1 binding named `SEAT_LOCKS_DB` pointing to that Preview database.
- A Preview-only `FIGHTS_ADMIN_TOKEN` secret. Do not reuse or expose the production token in Preview.
- The Preview database must contain the existing `admin_bookings` table schema and a synthetic test booking row. Do not copy real customer data into test fixtures.

## Preview-first setup

1. Create or select a dedicated D1 database for Preview testing. Confirm its database name and ID before changing any binding.
2. In Cloudflare Pages, configure the **Preview** environment's `SEAT_LOCKS_DB` binding to that Preview database. Leave the Production binding unchanged.
3. Configure a Preview-only `FIGHTS_ADMIN_TOKEN` secret. Never paste the token into source code, commits, screenshots, or chat.
   - Confirm the variable name is exactly `FIGHTS_ADMIN_TOKEN` (including the final `N`) and its type is **Secret** under the **Preview** environment.
   - After saving or changing this secret, create a **new Preview deployment** from `feature/internal-booking-notes`. Test the URL shown on that newest deployment; an older deployment may still use the previous environment configuration.
   - Do not add quotation marks or leading/trailing spaces around the token value.
4. Prepare the Preview database with the required existing schema, including `admin_bookings`, using a reviewed schema-only setup and synthetic test data.
5. Back up the Preview database, then apply `migrations/0004_booking_admin_notes.sql` to the **Preview database only**.
6. Verify that `booking_admin_notes` exists in Preview and that existing tables and records remain intact.
7. Deploy this branch to a Pages Preview environment. Do not merge or deploy to Production as part of this test.
8. Test an unauthorized request (expect HTTP 401).
9. Test a valid admin read for the synthetic Booking ID (expect HTTP 200).
10. Add a harmless test note to the synthetic booking (expect HTTP 201), then verify it appears in the read response.
11. Confirm existing booking and seat-lock flows are unchanged, without testing or issuing admission credentials.
12. Remove test notes and retire the Preview database when testing is complete, according to your retention policy.

## Production safeguards

- Do **not** apply migration 0004 to Production as part of Preview testing.
- Do **not** change the Production `SEAT_LOCKS_DB` binding or Production secret.
- Any later Production rollout requires a separate review, a verified Production backup, an explicit migration plan, and approval from the database owner.
- Do not merge this pull request or run a Production migration until that review is complete.

## API

Both routes require:

```http
Authorization: Bearer <FIGHTS_ADMIN_TOKEN>
```

### Read notes

```http
GET /api/booking-notes?bookingId=<existing-booking-id>
```

Returns up to 100 notes, newest first.

### Add a note

```http
POST /api/booking-notes
Content-Type: application/json
```

Body:

```json
{
  "bookingId": "synthetic-test-booking-id",
  "note": "Internal note for administrative follow-up"
}
```

The API verifies that the Booking ID exists in `admin_bookings`. Notes are limited to 2,000 characters. The actor label is assigned by the server as `admin`; it is not an individually verified staff identity.

## Data handling

- Do not put payment credentials, bank details, identity documents, or other sensitive information in notes.
- Use synthetic data for Preview tests.
- A note is an internal comment only. It does not confirm payment, approve a booking, issue admission, or grant entry.
