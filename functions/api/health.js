const H = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: H });
const REQUIRED = ['admin_bookings', 'fight_schedule', 'seat_locks', 'website_config'];

export async function onRequestGet({ env }) {
  const result = { ok: false, d1: false, kv: Boolean(env?.fights_kv), tables: [], missingTables: [] };
  if (!env?.SEAT_LOCKS_DB) return json({ ...result, error: 'D1 binding SEAT_LOCKS_DB is missing.' }, 503);
  try {
    const rows = await env.SEAT_LOCKS_DB.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    result.d1 = true;
    result.tables = (rows.results || []).map(row => row.name);
    result.missingTables = REQUIRED.filter(name => !result.tables.includes(name));
    result.ok = result.missingTables.length === 0;
    return json(result, result.ok ? 200 : 503);
  } catch {
    return json({ ...result, error: 'D1 query failed. Check database binding and migrations.' }, 503);
  }
}
