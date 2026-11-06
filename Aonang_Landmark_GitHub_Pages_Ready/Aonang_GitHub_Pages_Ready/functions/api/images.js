const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: HEADERS });
function authorized(request, env) { const expected = env?.FIGHTS_ADMIN_TOKEN; return Boolean(expected && request.headers.get('Authorization') === `Bearer ${expected}`); }
function validKey(value) { return typeof value === 'string' && /^[a-z0-9-]{1,100}$/.test(value); }
function storageKey(value) { return 'site_image_' + value.replaceAll('-', '_'); }
export async function onRequestGet({ request }) {
  const requested = new URL(request.url).searchParams.get('keys') || '';
  const keys = [...new Set(requested.split(',').filter(validKey))];
  if (keys.length > 40) return json({ error: 'Too many image keys.' }, 400);
  try {
    const values = await Promise.all(keys.map(key => fights_kv.get(storageKey(key))));
    const images = Object.fromEntries(keys.flatMap((key, index) => values[index] ? [[key, values[index]]] : []));
    return json({ images });
  } catch { return json({ error: 'Shared image storage is not configured.' }, 503); }
}
export async function onRequestPut({ request, env }) {
  if (!authorized(request, env)) return json({ error: 'Admin authorization required.' }, 401);
  let payload;
  try { payload = await request.json(); } catch { return json({ error: 'Invalid image upload.' }, 400); }
  if (!validKey(payload?.key) || typeof payload.dataUrl !== 'string' || !/^data:image\/(?:jpeg|png|webp);base64,/.test(payload.dataUrl) || payload.dataUrl.length > 450000) return json({ error: 'Image is invalid or too large. Please choose a smaller image.' }, 400);
  try { await fights_kv.put(storageKey(payload.key), payload.dataUrl); return json({ ok: true }); }
  catch { return json({ error: 'Could not save the image to shared storage.' }, 503); }
}
export async function onRequestDelete({ request, env }) {
  if (!authorized(request, env)) return json({ error: 'Admin authorization required.' }, 401);
  const key = new URL(request.url).searchParams.get('key');
  if (!validKey(key)) return json({ error: 'Invalid image key.' }, 400);
  try { await fights_kv.delete(storageKey(key)); return json({ ok: true }); }
  catch { return json({ error: 'Could not remove the shared image.' }, 503); }
}
