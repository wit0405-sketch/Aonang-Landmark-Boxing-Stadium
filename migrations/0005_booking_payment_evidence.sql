-- Customer-reported payment evidence metadata for internal recordkeeping only.
-- Every record remains unverified; this table cannot approve or confirm payment.
CREATE TABLE IF NOT EXISTS booking_payment_evidence (
  id TEXT PRIMARY KEY NOT NULL,
  booking_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('staff_entry','provider_reference')),
  reported_amount INTEGER,
  currency TEXT NOT NULL DEFAULT 'THB',
  external_reference TEXT,
  reported_at TEXT,
  evidence_note TEXT NOT NULL DEFAULT '',
  record_state TEXT NOT NULL DEFAULT 'received_unverified'
    CHECK (record_state = 'received_unverified'),
  actor_label TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_booking_payment_evidence_booking
  ON booking_payment_evidence(booking_id, created_at DESC);
