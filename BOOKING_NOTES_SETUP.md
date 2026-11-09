# Internal Booking Notes API

This feature is for internal administrative recordkeeping only. A note is not proof of payment, a booking approval, an admission ticket, or permission to enter an event.

## Prerequisites

- Cloudflare Pages Functions deployment.
- D1 binding named `SEAT_LOCKS_DB` pointing to the existing database.
- Existing `FIGHTS_ADMIN_TOKEN` secret configured in the Pages environment.
- Existing `admin_bookings` table from migration `0002_admin_data_d1.sql`.

Apply `migrations/0004_booking_admin_notes.sql` to the existing D1 database before deploying this branch. This migration only adds `booking_admin_notes`; it does not drop, rename, or rewrite existing tables.

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
  "bookingId": "existing-booking-id",
  "note": "Internal note for administrative follow-up"
}
```

The API verifies that the Booking ID exists in `admin_bookings`. Notes are limited to 2,000 characters. The actor label is assigned by the server as `admin`; it is not an individually verified staff identity.

## Safe rollout checklist

1. Export/backup the current D1 database.
2. Confirm the target D1 database is the existing production database, not a new empty database.
3. Apply migration 0004 and verify the new table exists.
4. Deploy the reviewed branch to a preview environment first.
5. Test an unauthorized request (expect HTTP 401).
6. Test a valid admin read for a known Booking ID (expect HTTP 200).
7. Add a harmless test note to a test booking (expect HTTP 201), then verify it appears in the read response.
8. Confirm existing booking and seat-lock flows are unchanged.
9. Do not put payment credentials, bank details, identity documents, or other sensitive information in notes.

Do not merge or deploy without reviewing the pull request and verifying the D1 backup and migration target.
