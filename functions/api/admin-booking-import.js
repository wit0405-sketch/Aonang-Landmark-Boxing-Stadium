const HEADERS = { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' };
const json = (value,status=200)=>new Response(JSON.stringify(value),{status,headers:HEADERS});
const authorized = (request,env)=>Boolean(env?.FIGHTS_ADMIN_TOKEN && request.headers.get('Authorization')===`Bearer ${env.FIGHTS_ADMIN_TOKEN}`);

function validBooking(b){
 const validSeats=b?.seats===undefined||(Array.isArray(b.seats)&&b.seats.length<=10&&b.seats.every(seat=>{
  if(!seat||typeof seat.id!=='string'||typeof seat.tier!=='string'||!Number.isInteger(seat.price))return false;
  if(/^S(?:[1-9]|[1-5][0-9]|6[0-6])$/.test(seat.id))return seat.tier==='Ringside'&&seat.price===1500;
  if(/^[A-H](?:[1-9]|1[0-8])$/.test(seat.id))return seat.tier==='VIP SEAT'&&seat.price===1200;
  if(/^G(?:[1-9]|[1-7][0-9]|80)$/.test(seat.id))return seat.tier==='GRAND STAND'&&seat.price===1000;
  return false;
 }));
 return b&&typeof b==='object'&&typeof b.name==='string'&&b.name.trim().length>0&&b.name.length<=100&&
  typeof b.email==='string'&&/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(b.email)&&b.email.length<=180&&
  typeof b.phone==='string'&&b.phone.length<=50&&['Fight night','Training'].includes(b.kind)&&
  typeof b.selection==='string'&&b.selection.length<=200&&typeof b.date==='string'&&b.date.length<=30&&
  Number.isInteger(Number(b.count))&&Number(b.count)>=1&&Number(b.count)<=10&&validSeats&&
  (b.total===undefined||(Number.isInteger(b.total)&&b.total>=0&&b.total<=25000));
}

export async function onRequestPost({request,env}){
 if(!authorized(request,env))return json({error:'Admin authorization required.'},401);
 if(!env?.SEAT_LOCKS_DB)return json({error:'D1 binding SEAT_LOCKS_DB is missing.'},503);
 if(!env?.fights_kv)return json({error:'KV binding fights_kv is missing.'},503);
 let payload;try{payload=await request.json()}catch{return json({error:'Invalid request.'},400)}
 if(payload?.source!=='website_bookings')return json({error:'Unsupported import source.'},400);
 try{
  const raw=await env.fights_kv.get('website_bookings');
  if(!raw)return json({ok:true,sourceCount:0,validCount:0,imported:0,skipped:0,reason:'No legacy KV booking list was found.'});
  let legacy;try{legacy=JSON.parse(raw)}catch{return json({error:'Legacy KV booking data is not valid JSON.'},422)}
  if(!Array.isArray(legacy)||legacy.length>1000)return json({error:'Legacy KV booking list has an invalid format or exceeds 1000 records.'},422);
  let validCount=0,imported=0,skipped=0;
  for(const booking of legacy){
   if(!validBooking(booking)||typeof booking.id!=='string'||!booking.id.trim()){skipped++;continue}
   validCount++;
   const result=await env.SEAT_LOCKS_DB.prepare('INSERT OR IGNORE INTO admin_bookings(id,status,created_at,payload) VALUES(?,?,?,?)')
    .bind(booking.id,booking.status||'new',booking.created||new Date().toISOString(),JSON.stringify(booking)).run();
   if(Number(result.meta?.changes||0)>0)imported++;else skipped++;
  }
  const count=await env.SEAT_LOCKS_DB.prepare('SELECT COUNT(*) AS total FROM admin_bookings').first();
  return json({ok:true,sourceCount:legacy.length,validCount,imported,skipped,totalInD1:Number(count?.total||0),sourcePreserved:true});
 }catch{return json({error:'Could not import legacy booking records. Check Preview D1 and KV bindings.'},503)}
}
