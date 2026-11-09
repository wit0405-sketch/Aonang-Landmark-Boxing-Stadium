const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: HEADERS });
const authorized = (request, env) =>
  Boolean(env?.FIGHTS_ADMIN_TOKEN &&
    request.headers.get("Authorization") === `Bearer ${env.FIGHTS_ADMIN_TOKEN}`);

export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) {
    return json({ error: "Admin authorization required." }, 401);
  }
  const bookingId = new URL(request.url).searchParams.get("bookingId");
  if (!bookingId || bookingId.length > 100) {
    return json({ error: "A valid bookingId is required." }, 400);
  }
  if (!env?.SEAT_LOCKS_DB) {
    return json({ error: "D1 binding SEAT_LOCKS_DB is missing." }, 503);
  }
  try {
    const result = await env.SEAT_LOCKS_DB.prepare(
      "SELECT id, booking_id, actor_label, note, created_at FROM booking_admin_notes WHERE booking_id = ? ORDER BY created_at DESC LIMIT 100"
    ).bind(bookingId).all();
    return json({ notes: result.results || [] });
  } catch {
    return json({ error: "Could not read internal notes. Apply migration 0004." }, 503);
  }
}

export async function onRequestPost({ request, env }) {
  if (!authorized(request, env)) {
    return json({ error: "Admin authorization required." }, 401);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }
  const bookingId = typeof body?.bookingId === "string" ? body.bookingId.trim() : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  const actorLabel = typeof body?.actorLabel === "string"
    ? body.actorLabel.trim().slice(0, 80)
    : "admin";

  if (!bookingId || bookingId.length > 100 || !note || note.length > 2000) {
    return json({ error: "bookingId and a note of 1–2000 characters are required." }, 400);
  }
  if (!env?.SEAT_LOCKS_DB) {
    return json({ error: "D1 binding SEAT_LOCKS_DB is missing." }, 503);
  }

  try {
    const booking = await env.SEAT_LOCKS_DB.prepare(
      "SELECT id FROM admin_bookings WHERE id = ?"
    ).bind(bookingId).first();
    if (!booking) return json({ error: "Booking record not found." }, 404);

    const item = {
      id: crypto.randomUUID(),
      booking_id: bookingId,
      actor_label: actorLabel || "admin",
      note,
      created_at: new Date().toISOString()
    };
    await env.SEAT_LOCKS_DB.prepare(
      "INSERT INTO booking_admin_notes (id, booking_id, actor_label, note, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(item.id, item.booking_id, item.actor_label, item.note, item.created_at).run();

    return json({ ok: true, note: item }, 201);
  } catch {
    return json({ error: "Could not save internal note. Confirm migration 0004 has been applied." }, 503);
  }
}
