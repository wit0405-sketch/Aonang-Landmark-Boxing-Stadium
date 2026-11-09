# Opn PromptPay + E-Ticket deployment

This change is additive. It keeps the existing `SEAT_LOCKS_DB`, `seat_locks`, and `admin_bookings` data in place.

## 1. Apply the D1 migration

Run the following against the existing D1 database already bound as `SEAT_LOCKS_DB`:

```bash
npx wrangler d1 execute aonang-seat-locks --remote --file=migrations/0003_payments_and_tickets.sql
```

Use the exact database name shown in the Cloudflare D1 binding if it differs. Do not create a replacement database.

## 2. Configure Cloudflare Pages secrets / variables

Set these in the Pages project settings (Functions > Variables and Secrets):

- `OPN_SECRET_KEY` — Opn secret key. Store as a secret; never commit it.
- `RESEND_API_KEY` — Resend API key for ticket email (secret).
- `TICKET_FROM_EMAIL` — sender address on a domain verified with Resend.
- `PUBLIC_SITE_URL` — canonical public website origin, e.g. `https://aonang-landmark-boxing-stadium.pages.dev`.

The Opn merchant account owner must enable PromptPay and use the correct test/live key pair. Start with test mode. Do not accept real payments until the merchant account and business details are approved and test payments have been verified.

## 3. Configure the Opn webhook

Add this HTTPS endpoint in the Opn dashboard:

```
https://YOUR-PAGES-DOMAIN/api/payments/webhook
```

Subscribe to `charge.complete`. The function retrieves the charge from Opn using the server-side secret key and verifies the amount and currency before changing the booking to paid and issuing the ticket.

## 4. Customer flow

1. Customer submits a fight-night booking; existing D1 booking and 15-minute seat hold are used.
2. `/api/payments/create` calculates the amount from validated seat IDs and creates a PromptPay charge.
3. Customer scans the QR code on `payment.html`.
4. The webhook confirms payment, changes held seats to booked, updates the existing booking to `paid`, and creates one e-ticket.
5. If Resend is configured, the customer receives an email link to `ticket.html`. The ticket page has a print / Save as PDF action.

Training requests remain booking requests and do not enter ticket checkout.

## 5. Important operational notes

- PromptPay QR availability must be enabled by Opn for the merchant account.
- The current e-ticket PDF action uses the browser's Print > Save as PDF flow.
- Email delivery requires a verified sender domain and valid Resend configuration.
- A payment received after the 15-minute seat hold expires is flagged `paid_seat_conflict` for staff review; no ticket is issued automatically in that case.
- PromptPay refunds are not supported by the current Opn PromptPay flow; staff must follow the merchant's approved refund procedure.
- Test the full flow in Opn test mode before switching to live credentials.
