const KEY = 'website_visitor_count';
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate' };
const json = (payload, status = 200) => new Response(JSON.stringify(payload), { status, headers: HEADERS });

export async function onRequestGet({ request, env }) {
  try {
    const current = Number(await env?.fights_kv?.get(KEY)) || 256;
    const shouldIncrement = new URL(request.url).searchParams.get('increment') === '1';
    const count = shouldIncrement ? Math.min(999999, current + 1) : current;
    if (shouldIncrement) await env?.fights_kv?.put(KEY, String(count));
    return json({ count });
  } catch (_) {
    return json({ error: 'Shared visitor storage is not configured. Configure the KV binding named fights_kv.' }, 503);
  }
}