const KEY = 'website_bookings';
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: HEADERS });
function authorized(request, env) { const expected = env?.FIGHTS_ADMIN_TOKEN; return Boolean(expected && request.headers.get('Authorization') === `Bearer ${expected}`); }
async function readBookings() { const raw = await fights_kv.get(KEY); if (!raw) return []; try { const value = JSON.parse(raw); return Array.isArray(value) ? value : []; } catch { return []; } }
function validBooking(b) {
  const validSeats = b?.seats === undefined || (Array.isArray(b.seats) && b.seats.length <= 10 && b.seats.every(seat => {
    if (!seat || typeof seat.id !== 'string' || typeof seat.tier !== 'string' || !Number.isInteger(seat.price)) return false;
    if (/^S(?:[1-9]|[1-5][0-9]|6[0-6])$/.test(seat.id)) return seat.tier === 'Ringside' && seat.price === 1500;
    if (/^[A-H](?:[1-9]|1[0-8])$/.test(seat.id)) return seat.tier === 'VIP SEAT' && seat.price === 1200;
    if (/^G(?:[1-9]|[1-7][0-9]|80)$/.test(seat.id)) return seat.tier === 'GRAND STAND' && seat.price === 1000;
    return false;
  }));
  return b && typeof b === 'object' &&
    typeof b.name === 'string' && b.name.trim().length > 0 && b.name.length <= 100 &&
    typeof b.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) && b.email.length <= 180 &&
    typeof b.phone === 'string' && b.phone.length <= 50 &&
    ['Fight night', 'Training'].includes(b.kind) &&
    typeof b.selection === 'string' && b.selection.length <= 200 &&
    typeof b.date === 'string' && b.date.length <= 30 &&
    Number.isInteger(Number(b.count)) && Number(b.count) >= 1 && Number(b.count) <= 10 &&
    validSeats && (b.total === undefined || (Number.isInteger(b.total) && b.total >= 0 && b.total <= 25000));
}
export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) return json({ error: 'Admin authorization required.' }, 401);
  try { return json({ bookings: await readBookings() }); }
  catch { return json({ error: 'Booking storage is not configured.' }, 503); }
}
export async function onRequestPost({ request, env }) {
  let payload;
  try { payload = await request.json(); } catch { return json({ error: 'Invalid booking request.' }, 400); }
  if (!validBooking(payload)) return json({ error: 'Booking details are incomplete or invalid.' }, 400);
  try {
    if (payload.kind === 'Fight night' && Array.isArray(payload.seats) && payload.seats.length) {
      const database = env?.SEAT_LOCKS_DB;
      if (!database || typeof payload.lockToken !== 'string' || !payload.lockToken) return json({ error: 'A valid temporary seat lock is required.' }, 409);
      const placeholders = payload.seats.map(() => '?').join(',');
      const now = Date.now();
      const held = await database.prepare(
        `SELECT seat_id FROM seat_locks WHERE event_date = ? AND lock_token = ? AND status = 'held' AND expires_at > ? AND seat_id IN (${placeholders})`
      ).bind(payload.date, payload.lockToken, now, ...payload.seats.map(seat => seat.id)).all();
      if ((held.results || []).length !== payload.seats.length) return json({ error: 'The seat lock expired or is incomplete.' }, 409);
    }
    const bookings = await readBookings();
    const booking = { id: crypto.randomUUID(), name: payload.name.trim(), email: payload.email.trim(), phone: payload.phone.trim(), kind: payload.kind, selection: payload.selection.trim(), date: payload.date, count: String(payload.count), ...(Array.isArray(payload.seats) ? { seats: payload.seats, total: payload.total, demo: true, lockToken: payload.lockToken || null } : {}), created: new Date().toISOString(), status: Array.isArray(payload.seats) && payload.seats.length ? 'pending_payment' : 'new' };
    bookings.unshift(booking);
    await fights_kv.put(KEY, JSON.stringify(bookings.slice(0, 1000)));
    return json({ ok: true, booking }, 201);
  } catch { return json({ error: 'Could not save the booking request.' }, 503); }
}
export async function onRequestPut({ request, env }) {
  if (!authorized(request, env)) return json({ error: 'Admin authorization required.' }, 401);
  let payload;
  try { payload = await request.json(); } catch { return json({ error: 'Invalid migration payload.' }, 400); }
  if (!Array.isArray(payload?.bookings) || payload.bookings.length > 1000 || payload.bookings.some(b => !validBooking(b) || typeof b.id !== 'string')) return json({ error: 'Booking migration data is invalid.' }, 400);
  try {
    const current = await readBookings();
    const ids = new Set(current.map(b => b.id));
    for (const booking of payload.bookings) if (!ids.has(booking.id)) { current.push({ ...booking, status: ['new','reviewed'].includes(booking.status) ? booking.status : 'new' }); ids.add(booking.id); }
    await fights_kv.put(KEY, JSON.stringify(current.slice(-1000)));
    return json({ ok: true, count: current.length });
  } catch { return json({ error: 'Could not migrate booking requests.' }, 503); }
}
export async function onRequestPatch({ request, env }) {
  if (!authorized(request, env)) return json({ error: 'Admin authorization required.' }, 401);
  let payload;
  try { payload = await request.json(); } catch { return json({ error: 'Invalid update.' }, 400); }
  if (typeof payload?.id !== 'string' || !['new','reviewed'].includes(payload.status)) return json({ error: 'Invalid booking update.' }, 400);
  try {
    const bookings = await readBookings();
    const index = bookings.findIndex(b => b.id === payload.id);
    if (index < 0) return json({ error: 'Booking not found.' }, 404);
    bookings[index] = { ...bookings[index], status: payload.status };
    await fights_kv.put(KEY, JSON.stringify(bookings));
    return json({ ok: true });
  } catch { return json({ error: 'Could not update the booking.' }, 503); }
}
export async function onRequestDelete({ request, env }) {
  if (!authorized(request, env)) return json({ error: 'Admin authorization required.' }, 401);
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'Booking ID is required.' }, 400);
  try {
    const bookings = (await readBookings()).filter(b => b.id !== id);
    await fights_kv.put(KEY, JSON.stringify(bookings));
    return json({ ok: true });
  } catch { return json({ error: 'Could not delete the booking.' }, 503); }
}
