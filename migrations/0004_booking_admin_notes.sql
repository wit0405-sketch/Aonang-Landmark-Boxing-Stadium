-- Internal administrative notes only. This table does not represent payment or admission status.
CREATE TABLE IF NOT EXISTS booking_admin_notes (
  id TEXT PRIMARY KEY NOT NULL,
  booking_id TEXT NOT NULL,
  actor_label TEXT NOT NULL DEFAULT 'admin',
  note TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_booking_admin_notes_booking
  ON booking_admin_notes(booking_id, created_at DESC);
