const HEADERS = { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' };
const json = (v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:HEADERS});
const db = env => env?.SEAT_LOCKS_DB;
const authorized = (req,env)=>Boolean(env?.FIGHTS_ADMIN_TOKEN && req.headers.get('Authorization')===`Bearer ${env.FIGHTS_ADMIN_TOKEN}`);
function validBooking(b){
 const validSeats=b?.seats===undefined||(Array.isArray(b.seats)&&b.seats.length<=10&&b.seats.every(seat=>{
  if(!seat||typeof seat.id!=='string'||typeof seat.tier!=='string'||!Number.isInteger(seat.price))return false;
  if(/^S(?:[1-9]|[1-5][0-9]|6[0-6])$/.test(seat.id))return seat.tier==='Ringside'&&seat.price===1500;
  if(/^[A-H](?:[1-9]|1[0-8])$/.test(seat.id))return seat.tier==='VIP SEAT'&&seat.price===1200;
  if(/^G(?:[1-9]|[1-7][0-9]|80)$/.test(seat.id))return seat.tier==='GRAND STAND'&&seat.price===1000;
  return false;
 }));
 return b&&typeof b==='object'&&typeof b.name==='string'&&b.name.trim().length>0&&b.name.length<=100&&
  typeof b.email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)&&b.email.length<=180&&
  typeof b.phone==='string'&&b.phone.length<=50&&['Fight night','Training'].includes(b.kind)&&
  typeof b.selection==='string'&&b.selection.length<=200&&typeof b.date==='string'&&b.date.length<=30&&
  Number.isInteger(Number(b.count))&&Number(b.count)>=1&&Number(b.count)<=10&&validSeats&&
  (b.total===undefined||(Number.isInteger(b.total)&&b.total>=0&&b.total<=25000));
}
async function allBookings(env){
 const database=db(env); if(!database)throw new Error('D1 binding SEAT_LOCKS_DB is missing.');
 const rows=await database.prepare('SELECT payload FROM admin_bookings ORDER BY created_at DESC LIMIT 1000').all();
 if(rows.results?.length)return rows.results.map(r=>{try{return JSON.parse(r.payload)}catch{return null}}).filter(Boolean);
 // One-time, non-destructive import from the existing KV data.
 if(env.fights_kv){
  const raw=await env.fights_kv.get('website_bookings');
  if(raw){let old=[];try{old=JSON.parse(raw)}catch{}
   if(Array.isArray(old))for(const b of old.slice(-1000)){if(validBooking(b)&&typeof b.id==='string'){
    await database.prepare('INSERT OR IGNORE INTO admin_bookings(id,status,created_at,payload) VALUES(?,?,?,?)')
     .bind(b.id,b.status||'new',b.created||new Date().toISOString(),JSON.stringify(b)).run();
   }}
   const imported=await database.prepare('SELECT payload FROM admin_bookings ORDER BY created_at DESC LIMIT 1000').all();
   return (imported.results||[]).map(r=>{try{return JSON.parse(r.payload)}catch{return null}}).filter(Boolean);
  }
 }
 return [];
}
export async function onRequestGet({request,env}){
 if(!authorized(request,env))return json({error:'Admin authorization required.'},401);
 try{return json({bookings:await allBookings(env)})}catch{return json({error:'D1 booking storage is not configured. Check SEAT_LOCKS_DB and apply migration 0002.'},503)}
}
export async function onRequestPost({request,env}){
 let p;try{p=await request.json()}catch{return json({error:'Invalid booking request.'},400)}
 // Admin status changes use POST for reliable Cloudflare Pages Functions routing.
 if(p?.action==='admin_update'){
  if(!authorized(request,env))return json({error:'Admin authorization required.'},401);
  if(typeof p.id!=='string'||!['new','reviewed'].includes(p.status))return json({error:'Invalid booking update.'},400);
  try{
   const database=db(env);if(!database)throw new Error('D1 binding missing');
   const row=await database.prepare('SELECT payload FROM admin_bookings WHERE id=?').bind(p.id).first();
   if(!row)return json({error:'Booking not found.'},404);
   const booking={...JSON.parse(row.payload),status:p.status};
   await database.prepare('UPDATE admin_bookings SET status=?,payload=? WHERE id=?').bind(p.status,JSON.stringify(booking),p.id).run();
   return json({ok:true,booking});
  }catch(error){return json({error:'Could not update booking in D1.',detail:String(error?.message||error).slice(0,240)},503)}
 }
 if(!validBooking(p))return json({error:'Booking details are incomplete or invalid.'},400);
 try{
  const database=db(env);if(!database)throw new Error('D1 missing');
  if(p.kind==='Fight night'&&Array.isArray(p.seats)&&p.seats.length){
   if(typeof p.lockToken!=='string'||!p.lockToken)return json({error:'A valid temporary seat lock is required.'},409);
   const marks=p.seats.map(()=>'?').join(',');
   const held=await database.prepare(`SELECT seat_id FROM seat_locks WHERE event_date=? AND lock_token=? AND status='held' AND expires_at>? AND seat_id IN (${marks})`)
    .bind(p.date,p.lockToken,Date.now(),...p.seats.map(s=>s.id)).all();
   if((held.results||[]).length!==p.seats.length)return json({error:'The seat lock expired or is incomplete.'},409);
  }
  const booking={id:crypto.randomUUID(),name:p.name.trim(),email:p.email.trim(),phone:p.phone.trim(),kind:p.kind,selection:p.selection.trim(),date:p.date,count:String(p.count),...(Array.isArray(p.seats)?{seats:p.seats,total:p.total,demo:true,lockToken:p.lockToken||null}:{}),created:new Date().toISOString(),status:Array.isArray(p.seats)&&p.seats.length?'pending_payment':'new'};
  await database.prepare('INSERT INTO admin_bookings(id,status,created_at,payload) VALUES(?,?,?,?)').bind(booking.id,booking.status,booking.created,JSON.stringify(booking)).run();
  return json({ok:true,booking},201);
 }catch{return json({error:'Could not save booking to D1. Check the SEAT_LOCKS_DB binding and migration.'},503)}
}
export async function onRequestPut({request,env}){
 if(!authorized(request,env))return json({error:'Admin authorization required.'},401);
 let p;try{p=await request.json()}catch{return json({error:'Invalid migration payload.'},400)}
 if(!Array.isArray(p?.bookings)||p.bookings.length>1000||p.bookings.some(b=>!validBooking(b)||typeof b.id!=='string'))return json({error:'Booking migration data is invalid.'},400);
 try{const database=db(env);if(!database)throw new Error('D1 missing');
  for(const b of p.bookings){const item={...b,status:['new','reviewed'].includes(b.status)?b.status:(b.status||'new')};
   await database.prepare('INSERT OR IGNORE INTO admin_bookings(id,status,created_at,payload) VALUES(?,?,?,?)')
    .bind(item.id,item.status,item.created||new Date().toISOString(),JSON.stringify(item)).run();
  }
  const count=await database.prepare('SELECT COUNT(*) AS total FROM admin_bookings').first();
  return json({ok:true,count:Number(count?.total||0)});
 }catch{return json({error:'Could not import booking requests into D1. Apply migration 0002.'},503)}
}
export async function onRequestPatch({request,env}){
 if(!authorized(request,env))return json({error:'Admin authorization required.'},401);
 let p;try{p=await request.json()}catch{return json({error:'Invalid update.'},400)}
 if(typeof p?.id!=='string'||!['new','reviewed'].includes(p.status))return json({error:'Invalid booking update.'},400);
 try{const database=db(env);const row=await database.prepare('SELECT payload FROM admin_bookings WHERE id=?').bind(p.id).first();if(!row)return json({error:'Booking not found.'},404);
  const b={...JSON.parse(row.payload),status:p.status};
  await database.prepare('UPDATE admin_bookings SET status=?,payload=? WHERE id=?').bind(p.status,JSON.stringify(b),p.id).run();return json({ok:true});
 }catch{return json({error:'Could not update booking in D1.'},503)}
}
export async function onRequestDelete({request,env}){
 if(!authorized(request,env))return json({error:'Admin authorization required.'},401);
 const id=new URL(request.url).searchParams.get('id');if(!id)return json({error:'Booking ID is required.'},400);
 try{await db(env).prepare('DELETE FROM admin_bookings WHERE id=?').bind(id).run();return json({ok:true})}
 catch{return json({error:'Could not delete booking from D1.'},503)}
}
