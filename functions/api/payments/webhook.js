const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
async function retrieveCharge(id,secret){
 const response=await fetch('https://api.omise.co/charges/'+encodeURIComponent(id),{headers:{Authorization:'Basic '+btoa(secret+':'),Accept:'application/json'}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error('Could not verify payment with provider.');
 return data;
}
async function sendTicketEmail(env,booking,ticketId){
 if(!env.RESEND_API_KEY || !env.TICKET_FROM_EMAIL) return {sent:false,reason:'Email provider is not configured'};
 const origin=(env.PUBLIC_SITE_URL||'https://aonang-landmark-boxing-stadium.pages.dev').replace(/\/$/,'');
 const ticketUrl=origin+'/ticket.html?id='+encodeURIComponent(ticketId);
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({
  from:env.TICKET_FROM_EMAIL,to:[booking.email],subject:'Your Aonang Landmark Boxing Stadium e-ticket',
  html:'<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#171717"><h1>Aonang Landmark Boxing Stadium</h1><h2>Your e-ticket is ready</h2><p>Hello '+String(booking.name||'Guest').replace(/[<>]/g,'')+', your payment has been confirmed.</p><p><b>Booking:</b> '+booking.id+'</p><p><b>Seats:</b> '+booking.seats.map(s=>s.id).join(', ')+'</p><p><a href="'+ticketUrl+'">Open your e-ticket and download PDF</a></p><p>Please show the QR code at the stadium entrance.</p></div>'
 })});
 if(!response.ok) return {sent:false,reason:'Email provider rejected the message'};
 return {sent:true};
}
export async function onRequestPost({request,env}){
 const database=env?.SEAT_LOCKS_DB;
 if(!database || !env.OPN_SECRET_KEY) return json({error:'Payment service is not configured.'},503);
 let event;try{event=await request.json()}catch{return json({error:'Invalid webhook body.'},400)}
 if(event?.key!=='charge.complete' || typeof event?.data?.id!=='string') return json({ok:true,ignored:true});
 try{
  const charge=await retrieveCharge(event.data.id,env.OPN_SECRET_KEY);
  const payment=await database.prepare('SELECT * FROM booking_payments WHERE charge_id=?').bind(charge.id).first();
  if(!payment) return json({error:'Payment record not found.'},404);
  if(charge.status!=='successful') {
   await database.prepare('UPDATE booking_payments SET status=?,updated_at=? WHERE id=?').bind(charge.status||'failed',new Date().toISOString(),payment.id).run();
   return json({ok:true,status:charge.status||'failed'});
  }
  if(Number(charge.amount)!==Number(payment.amount)*100 || String(charge.currency).toUpperCase()!=='THB') return json({error:'Payment amount verification failed.'},409);
  const row=await database.prepare('SELECT payload FROM admin_bookings WHERE id=?').bind(payment.booking_id).first();
  if(!row) return json({error:'Booking record not found.'},404);
  const booking=JSON.parse(row.payload);
  const seats=booking.seats||[];
  const held=await database.prepare("SELECT COUNT(*) AS total FROM seat_locks WHERE event_date=? AND lock_token=? AND status='held' AND expires_at>?")
   .bind(booking.date,booking.lockToken,Date.now()).first();
  if(Number(held?.total||0)!==seats.length) {
   await database.prepare("UPDATE booking_payments SET status='paid_seat_conflict',updated_at=? WHERE id=?").bind(new Date().toISOString(),payment.id).run();
   return json({ok:true,status:'paid_seat_conflict',needsManualReview:true});
  }
  const ticketId='ALB-'+new Date().getUTCFullYear()+'-'+crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase();
  const ticket={id:ticketId,bookingId:booking.id,name:booking.name,email:booking.email,eventDate:booking.date,seats,amount:payment.amount,currency:'THB',status:'valid',issuedAt:new Date().toISOString()};
  await database.batch([
   database.prepare("UPDATE booking_payments SET status='successful',updated_at=? WHERE id=?").bind(new Date().toISOString(),payment.id),
   database.prepare("UPDATE seat_locks SET status='booked',expires_at=NULL WHERE event_date=? AND lock_token=? AND status='held'").bind(booking.date,booking.lockToken),
   database.prepare("UPDATE admin_bookings SET status='paid',payload=? WHERE id=?").bind(JSON.stringify({...booking,status:'paid',paymentId:payment.id,ticketId}),booking.id),
   database.prepare("INSERT OR IGNORE INTO issued_tickets(id,booking_id,payment_id,status,payload,created_at) VALUES(?,?,?,'valid',?,?)").bind(ticketId,booking.id,payment.id,JSON.stringify(ticket),ticket.issuedAt)
  ]);
  const email=await sendTicketEmail(env,booking,ticketId);
  return json({ok:true,status:'paid',ticketId,email});
 }catch(error){return json({error:'Webhook processing failed.',detail:String(error?.message||error).slice(0,180)},500)}
}
