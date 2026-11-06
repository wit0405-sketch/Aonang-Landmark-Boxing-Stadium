const KEY = 'fight_schedule';
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const defaults = [
  { id: 'f1', date: '2026-10-25', title: 'Thai Fight · 5 Rounds', type: 'main', status: 'upcoming' },
  { id: 'f2', date: '2026-10-26', title: 'Muay Thai Super Fight', type: 'co-main', status: 'upcoming' },
  { id: 'f3', date: '2026-10-27', title: 'Local Fight Night', type: 'local', status: 'upcoming' },
  { id: 'f4', date: '2026-10-28', title: 'Thai Fight · 5 Rounds', type: 'main', status: 'upcoming' }
];
const json = (payload, status = 200) => new Response(JSON.stringify(payload), { status, headers: JSON_HEADERS });
function validSchedule(fights) {
  return Array.isArray(fights) && fights.length <= 100 && fights.every(fight =>
    fight && typeof fight.id === 'string' && fight.id.length <= 80 &&
    typeof fight.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fight.date) &&
    typeof fight.title === 'string' && fight.title.trim().length > 0 && fight.title.length <= 100 &&
    ['main', 'co-main', 'local'].includes(fight.type) &&
    ['upcoming', 'live', 'completed', 'cancelled'].includes(fight.status || 'upcoming') &&
    (fight.description == null || (typeof fight.description === 'string' && fight.description.length <= 500))
  );
}
export async function onRequestGet() {
  try {
    const saved = await fights_kv.get(KEY);
    return json({ fights: saved ? JSON.parse(saved) : defaults, initialized: Boolean(saved) });
  } catch (error) {
    return json({ error: 'Shared schedule storage is not configured. Bind the EdgeOne KV namespace as fights_kv.' }, 503);
  }
}
export async function onRequestPut({ request, env }) {
  const expectedToken = env?.FIGHTS_ADMIN_TOKEN;
  if (!expectedToken) return json({ error: 'FIGHTS_ADMIN_TOKEN is not configured in EdgeOne.' }, 503);
  if (request.headers.get('Authorization') !== `Bearer ${expectedToken}`) return json({ error: 'Invalid admin key.' }, 401);
  let payload;
  try { payload = await request.json(); } catch { return json({ error: 'Request must contain valid JSON.' }, 400); }
  if (!validSchedule(payload?.fights)) return json({ error: 'Schedule data is invalid.' }, 400);
  try {
    await fights_kv.put(KEY, JSON.stringify(payload.fights));
    return json({ ok: true, count: payload.fights.length });
  } catch (error) {
    return json({ error: 'Could not save the schedule to EdgeOne KV. Check the namespace binding.' }, 503);
  }
}