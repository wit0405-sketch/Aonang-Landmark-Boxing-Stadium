const KEY = 'website_config';
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: HEADERS });
function authorized(request, env) { const expected = env?.FIGHTS_ADMIN_TOKEN; return Boolean(expected && request.headers.get('Authorization') === `Bearer ${expected}`); }
function parseYoutube(value) {
  try {
    const url = new URL(value);
    if (!['youtube.com','www.youtube.com','m.youtube.com','youtu.be','youtube-nocookie.com','www.youtube-nocookie.com'].includes(url.hostname)) return null;
    const id = url.hostname.endsWith('youtu.be') ? url.pathname.split('/').filter(Boolean)[0] : (url.searchParams.get('v') || url.pathname.match(/\/(?:embed|live|shorts)\/([^/?]+)/)?.[1]);
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}
export async function onRequestGet() {
  try { const raw = await fights_kv.get(KEY); return json(raw ? JSON.parse(raw) : {}); }
  catch { return json({ error: 'Website settings storage is not configured.' }, 503); }
}
export async function onRequestPut({ request, env }) {
  if (!authorized(request, env)) return json({ error: 'Admin authorization required.' }, 401);
  let payload;
  try { payload = await request.json(); } catch { return json({ error: 'Invalid settings.' }, 400); }
  const id = parseYoutube(payload?.youtubeUrl || '');
  if (!id) return json({ error: 'A valid YouTube URL is required.' }, 400);
  try {
    const settings = { youtubeUrl: String(payload.youtubeUrl).slice(0, 300), youtubeEmbed: `https://www.youtube.com/embed/${id}`, updated: new Date().toISOString() };
    await fights_kv.put(KEY, JSON.stringify(settings));
    return json({ ok: true, ...settings });
  } catch { return json({ error: 'Could not save website settings.' }, 503); }
}
