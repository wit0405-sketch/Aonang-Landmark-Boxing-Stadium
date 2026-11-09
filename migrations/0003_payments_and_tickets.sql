-- Additive payment and e-ticket tables. Existing booking and seat-lock rows are preserved.
CREATE TABLE IF NOT EXISTS booking_payments (
  id TEXT PRIMARY KEY NOT NULL,
  booking_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'opn',
  charge_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'pending',
  qr_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_booking_payments_booking ON booking_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_status ON booking_payments(status);

CREATE TABLE IF NOT EXISTS issued_tickets (
  id TEXT PRIMARY KEY NOT NULL,
  booking_id TEXT NOT NULL,
  payment_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid',
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT,
  email_status TEXT NOT NULL DEFAULT 'pending',
  email_sent_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_issued_tickets_booking ON issued_tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_issued_tickets_status ON issued_tickets(status);
