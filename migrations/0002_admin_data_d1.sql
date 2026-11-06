-- Additive migration. Existing seat_locks table is retained.
CREATE TABLE IF NOT EXISTS admin_bookings (
 id TEXT PRIMARY KEY NOT NULL,
 status TEXT NOT NULL DEFAULT 'new',
 created_at TEXT NOT NULL,
 payload TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_bookings_created ON admin_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_bookings_status ON admin_bookings(status);
CREATE TABLE IF NOT EXISTS fight_schedule (
 id TEXT PRIMARY KEY NOT NULL,
 event_date TEXT NOT NULL,
 payload TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fight_schedule_date ON fight_schedule(event_date);
CREATE TABLE IF NOT EXISTS website_config (
 config_key TEXT PRIMARY KEY NOT NULL,
 payload TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
