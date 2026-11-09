const HEADERS={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:HEADERS});
const authorized=(request,env)=>Boolean(env?.FIGHTS_ADMIN_TOKEN&&request.headers.get("Authorization")===`Bearer ${env.FIGHTS_ADMIN_TOKEN}`);
export async function onRequestGet({request,env}){
 if(!authorized(request,env))return json({error:"Admin authorization required."},401);
 const bookingId=new URL(request.url).searchParams.get("bookingId");
 if(!bookingId||bookingId.length>100)return json({error:"A valid bookingId is required."},400);
 if(!env?.SEAT_LOCKS_DB)return json({error:"D1 binding SEAT_LOCKS_DB is missing."},503);
 try{
  const result=await env.SEAT_LOCKS_DB.prepare("SELECT id,booking_id,source_type,reported_amount,currency,external_reference,reported_at,evidence_note,record_state,actor_label,created_at FROM booking_payment_evidence WHERE booking_id=? ORDER BY created_at DESC LIMIT 100").bind(bookingId).all();
  return json({records:result.results||[]});
 }catch{return json({error:"Could not read evidence records. Apply the reviewed Preview migration first."},503)}
}
export async function onRequestPost({request,env}){
 if(!authorized(request,env))return json({error:"Admin authorization required."},401);
 if(!env?.SEAT_LOCKS_DB)return json({error:"D1 binding SEAT_LOCKS_DB is missing."},503);
 let body;try{body=await request.json()}catch{return json({error:"Invalid JSON body."},400)}
 const bookingId=typeof body?.bookingId==="string"?body.bookingId.trim():"";
 const sourceType=body?.sourceType;
 const reference=typeof body?.externalReference==="string"?body.externalReference.trim():"";
 const note=typeof body?.evidenceNote==="string"?body.evidenceNote.trim():"";
 const amount=body?.reportedAmount;
 const reportedAt=typeof body?.reportedAt==="string"?body.reportedAt.trim():"";
 if(!bookingId||bookingId.length>100||!["staff_entry","provider_reference"].includes(sourceType)||
  (amount!==undefined&&amount!==null&&(!Number.isInteger(amount)||amount<0||amount>100000000))||
  reference.length>160||note.length>1000||reportedAt.length>40)
  return json({error:"Invalid evidence record fields."},400);
 try{
  const booking=await env.SEAT_LOCKS_DB.prepare("SELECT id FROM admin_bookings WHERE id=?").bind(bookingId).first();
  if(!booking)return json({error:"Booking record not found."},404);
  const item={id:crypto.randomUUID(),booking_id:bookingId,source_type:sourceType,reported_amount:amount??null,currency:"THB",external_reference:reference||null,reported_at:reportedAt||null,evidence_note:note,record_state:"received_unverified",actor_label:"admin",created_at:new Date().toISOString()};
  await env.SEAT_LOCKS_DB.prepare("INSERT INTO booking_payment_evidence (id,booking_id,source_type,reported_amount,currency,external_reference,reported_at,evidence_note,record_state,actor_label,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(item.id,item.booking_id,item.source_type,item.reported_amount,item.currency,item.external_reference,item.reported_at,item.evidence_note,item.record_state,item.actor_label,item.created_at).run();
  return json({ok:true,record:item},201);
 }catch{return json({error:"Could not save evidence metadata. Confirm the reviewed Preview migration is applied."},503)}
}
