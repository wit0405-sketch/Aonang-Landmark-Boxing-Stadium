const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: HEADERS });
const HOLD_MINUTES = 15;
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const validSeat = id => /^S(?:[1-9]|[1-5]\d|6[0-6])$/.test(id) ||
  /^[A-H](?:[1-9]|1[0-8])$/.test(id) || /^G(?:[1-9]|[1-7]\d|80)$/.test(id);
const authorized = (request, env) => Boolean(env?.FIGHTS_ADMIN_TOKEN && request.headers.get('Authorization') === `Bearer ${env.FIGHTS_ADMIN_TOKEN}`);
function db(env) { return env?.SEAT_LOCKS_DB; }

export async function onRequestGet({ request, env }) {
  const database = db(env);
  if (!database) return json({ error: 'Seat-lock database is not configured.' }, 503);
  const date = new URL(request.url).searchParams.get('date');
  if (!validDate(date)) return json({ error: 'A valid event date is required.' }, 400);
  try {
    const now = Date.now();
    await database.prepare("DELETE FROM seat_locks WHERE status = 'held' AND expires_at <= ?").bind(now).run();
    const result = await database.prepare(
      "SELECT seat_id, status, expires_at FROM seat_locks WHERE event_date = ? AND (status = 'booked' OR expires_at > ?)"
    ).bind(date, now).all();
    return json({ seats: result.results || [], serverTime: now });
  } catch { return json({ error: 'Could not read seat availability.' }, 503); }
}

export async function onRequestPost({ request, env }) {
  const database = db(env);
  if (!database) return json({ error: 'Seat-lock database is not configured.' }, 503);
  let payload;
  try { payload = await request.json(); } catch { return json({ error: 'Invalid seat-lock request.' }, 400); }
  const { action, date, seats, lockToken } = payload || {};
  if (!validDate(date)) return json({ error: 'A valid event date is required.' }, 400);

  try {
    const now = Date.now();
    await database.prepare("DELETE FROM seat_locks WHERE status = 'held' AND expires_at <= ?").bind(now).run();

    if (action === 'release') {
      if (typeof lockToken !== 'string' || !lockToken) return json({ error: 'Lock token is required.' }, 400);
      await database.prepare("DELETE FROM seat_locks WHERE lock_token = ? AND status = 'held'").bind(lockToken).run();
      return json({ ok: true });
    }

    if (action === 'confirm') {
      if (!authorized(request, env)) return json({ error: 'Payment confirmation authorization required.' }, 401);
      if (typeof lockToken !== 'string' || !lockToken) return json({ error: 'Lock token is required.' }, 400);
      const result = await database.prepare(
        "UPDATE seat_locks SET status = 'booked', expires_at = NULL WHERE lock_token = ? AND event_date = ? AND status = 'held' AND expires_at > ?"
      ).bind(lockToken, date, now).run();
      if (!result.meta?.changes) return json({ error: 'The seat lock has expired or is no longer valid.' }, 409);
      return json({ ok: true, status: 'booked' });
    }

    if (action !== 'lock' || !Array.isArray(seats) || seats.length < 1 || seats.length > 10 ||
        seats.some(id => typeof id !== 'string' || !validSeat(id)) || new Set(seats).size !== seats.length) {
      return json({ error: 'Select 1–10 valid seats.' }, 400);
    }
    const token = crypto.randomUUID();
    const expiresAt = now + HOLD_MINUTES * 60 * 1000;
    const placeholders = seats.map(() => '(?, ?, ?, ?, ?, ?)').join(',');
    const values = seats.flatMap(seat => [date, seat, token, 'held', expiresAt, now]);
    const sql = `INSERT INTO seat_locks (event_date, seat_id, lock_token, status, expires_at, created_at)
      SELECT v.event_date, v.seat_id, v.lock_token, v.status, v.expires_at, v.created_at
      FROM (SELECT ${seats.map((_, i) => `? AS event_date, ? AS seat_id, ? AS lock_token, ? AS status, ? AS expires_at, ? AS created_at${i < seats.length-1 ? ' UNION ALL SELECT ' : ''}`).join('')}) v
      WHERE NOT EXISTS (
        SELECT 1 FROM seat_locks existing
        WHERE existing.event_date = v.event_date AND existing.seat_id = v.seat_id
          AND (existing.status = 'booked' OR (existing.status = 'held' AND existing.expires_at > ?))
      )`;
    const bindValues = seats.flatMap(seat => [date, seat, token, 'held', expiresAt, now]);
    bindValues.push(now);
    const result = await database.prepare(sql).bind(...bindValues).run();
    if (Number(result.meta?.changes || 0) !== seats.length) {
      await database.prepare("DELETE FROM seat_locks WHERE lock_token = ? AND status = 'held'").bind(token).run();
      const current = await database.prepare(
        "SELECT seat_id, status, expires_at FROM seat_locks WHERE event_date = ? AND (status = 'booked' OR expires_at > ?)"
      ).bind(date, now).all();
      return json({ error: 'One or more selected seats are no longer available.', seats: current.results || [] }, 409);
    }
    return json({ ok: true, lockToken: token, expiresAt, holdMinutes: HOLD_MINUTES, seats });
  } catch (error) {
    return json({ error: 'Could not lock seats. Check the D1 database setup.' }, 503);
  }
}
