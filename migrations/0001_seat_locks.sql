CREATE TABLE IF NOT EXISTS seat_locks (
  event_date TEXT NOT NULL,
  seat_id TEXT NOT NULL,
  lock_token TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('held','booked')),
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (event_date, seat_id),
  UNIQUE (lock_token, seat_id)
);
CREATE INDEX IF NOT EXISTS idx_seat_locks_expiry
  ON seat_locks(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_seat_locks_token
  ON seat_locks(lock_token);
