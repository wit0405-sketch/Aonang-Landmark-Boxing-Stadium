const HEADERS = { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' };
const json = (value, status=200) => new Response(JSON.stringify(value), {status, headers:HEADERS});
const db = env => env?.SEAT_LOCKS_DB;
const validEmail = value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const tierPrice = seat => {
  if (/^S(?:[1-9]|[1-5][0-9]|6[0-6])$/.test(seat?.id) && seat.tier === 'Ringside') return 1500;
  if (/^[A-H](?:[1-9]|1[0-8])$/.test(seat?.id) && seat.tier === 'VIP SEAT') return 1200;
  if (/^G(?:[1-9]|[1-7][0-9]|80)$/.test(seat?.id) && seat.tier === 'GRAND STAND') return 1000;
  return 0;
};
async function opnRequest(path, secret, init={}) {
  const auth = btoa(secret + ':');
  const response = await fetch('https://api.omise.co' + path, {
    ...init,
    headers: { Authorization:'Basic '+auth, Accept:'application/json', ...(init.headers||{}) }
  });
  const body = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(body.message || 'Payment provider request failed.');
  return body;
}
export async function onRequestPost({request,env}) {
  const database=db(env);
  if (!database) return json({error:'D1 binding SEAT_LOCKS_DB is missing.'},503);
  if (!env.OPN_SECRET_KEY) return json({error:'Payment provider is not configured. Ask the site administrator to add OPN_SECRET_KEY.'},503);
  let input; try { input=await request.json(); } catch { return json({error:'Invalid request.'},400); }
  if (typeof input?.bookingId!=='string' || input.bookingId.length>80) return json({error:'Booking ID is required.'},400);
  try {
    const row=await database.prepare('SELECT id,status,payload FROM admin_bookings WHERE id=?').bind(input.bookingId).first();
    if (!row) return json({error:'Booking not found.'},404);
    const booking=JSON.parse(row.payload);
    if (booking.kind!=='Fight night' || !Array.isArray(booking.seats) || !booking.seats.length) return json({error:'Online checkout is currently available for fight-night seat bookings only.'},400);
    if (!validEmail(booking.email)) return json({error:'A valid customer email is required.'},400);
    if (row.status==='paid' || booking.status==='paid') return json({error:'This booking has already been paid.'},409);
    if (!booking.lockToken) return json({error:'Seat hold is missing. Please select the seats again.'},409);
    const amountBaht=booking.seats.reduce((sum,seat)=>sum+tierPrice(seat),0);
    if (!amountBaht || amountBaht>150000) return json({error:'Invalid ticket total.'},400);
    const held=await database.prepare("SELECT COUNT(*) AS total FROM seat_locks WHERE event_date=? AND lock_token=? AND status='held' AND expires_at>?")
      .bind(booking.date,booking.lockToken,Date.now()).first();
    if (Number(held?.total||0)!==booking.seats.length) return json({error:'Seat hold expired. Please return to booking and select seats again.'},409);
    const existing=await database.prepare("SELECT id,charge_id,qr_url,status FROM booking_payments WHERE booking_id=? AND status='pending' ORDER BY created_at DESC LIMIT 1").bind(booking.id).first();
    if (existing) return json({paymentId:existing.id,chargeId:existing.charge_id,qrUrl:existing.qr_url,status:existing.status,amount:amountBaht,currency:'THB'});
    const expiresAt=new Date(Date.now()+14*60*1000).toISOString();
    const params=new URLSearchParams();
    params.set('amount',String(amountBaht*100));
    params.set('currency','THB');
    params.set('source[type]','promptpay');
    params.set('description','Aonang Landmark Boxing Stadium tickets '+booking.id);
    params.set('metadata[booking_id]',booking.id);
    params.set('expires_at',expiresAt);
    const charge=await opnRequest('/charges',env.OPN_SECRET_KEY,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params.toString()});
    const qrUrl=charge?.source?.scannable_code?.image?.download_uri || charge?.source?.scannable_code?.image?.url || null;
    if (!charge?.id || !qrUrl) return json({error:'Payment QR could not be generated. Check PromptPay activation in the Opn merchant account.'},502);
    const paymentId=crypto.randomUUID(), now=new Date().toISOString();
    await database.prepare('INSERT INTO booking_payments(id,booking_id,provider,charge_id,amount,currency,status,qr_url,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)')
      .bind(paymentId,booking.id,'opn',charge.id,amountBaht,'THB',charge.status||'pending',qrUrl,now,now).run();
    return json({ok:true,paymentId,chargeId:charge.id,qrUrl,amount:amountBaht,currency:'THB',expiresAt,status:charge.status||'pending'},201);
  } catch(error) {
    return json({error:'Could not start PromptPay payment.',detail:String(error?.message||error).slice(0,200)},502);
  }
}
