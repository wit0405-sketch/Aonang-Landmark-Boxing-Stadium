const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function onRequestGet({request,env}){
 const bookingId=new URL(request.url).searchParams.get('bookingId');
 if(!bookingId || bookingId.length>80) return json({error:'Booking ID is required.'},400);
 try{
  const row=await env.SEAT_LOCKS_DB.prepare('SELECT id,charge_id,amount,currency,status,qr_url FROM booking_payments WHERE booking_id=? ORDER BY created_at DESC LIMIT 1').bind(bookingId).first();
  if(!row) return json({error:'Payment not found.'},404);
  const bookingRow=await env.SEAT_LOCKS_DB.prepare('SELECT payload FROM admin_bookings WHERE id=?').bind(bookingId).first();
  const booking=bookingRow?JSON.parse(bookingRow.payload):{};
  return json({payment:{id:row.id,chargeId:row.charge_id,amount:row.amount,currency:row.currency,status:row.status,qrUrl:row.qr_url},ticketId:booking.ticketId||null});
 }catch{return json({error:'Could not read payment status.'},503)}
}
