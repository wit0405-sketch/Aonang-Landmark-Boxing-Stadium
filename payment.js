(()=> {
 const bookingId=new URLSearchParams(location.search).get('booking');
 const $=id=>document.getElementById(id);
 let timer=null, checking=false;
 const baht=v=>'฿'+Number(v||0).toLocaleString('en-US');
 function message(text,error=false){$('paymentStatus').textContent=text;$('paymentStatus').classList.toggle('payment-error',error)}
 async function check(){
  if(!bookingId){message('Missing booking reference. Please contact the stadium.',true);return}
  if(checking)return;checking=true;
  try{
   const r=await fetch('/api/payments/status?bookingId='+encodeURIComponent(bookingId),{cache:'no-store'});
   const data=await r.json();if(!r.ok)throw new Error(data.error||'Unable to read payment status.');
   const p=data.payment;
   $('paymentAmount').textContent=baht(p.amount);
   $('paymentState').textContent=p.status.toUpperCase();
   if(p.qrUrl && !$('paymentQr').src){$('paymentQr').src=p.qrUrl;$('paymentQr').hidden=false}
   if(p.status==='successful' && data.ticketId){
    clearInterval(timer);$('paymentState').textContent='PAID';message('Payment confirmed. Your e-ticket is ready.');
    $('paymentIntro').textContent='Thank you. Your ticket is ready to view and print.';
    const a=document.createElement('a');a.className='btn btn-red';a.href='ticket.html?id='+encodeURIComponent(data.ticketId);a.textContent='OPEN E-TICKET';$('paymentStatus').append(' ',a);
   }else if(['failed','expired','paid_seat_conflict'].includes(p.status)){
    clearInterval(timer);message(p.status==='paid_seat_conflict'?'Payment received, but the seat hold needs staff review. Please contact the stadium.':'This payment was not completed. Please return to booking and try again.',true);
   }else message('Waiting for payment confirmation. This page checks automatically.');
  }catch(e){message(e.message,true)}finally{checking=false}
 }
 $('checkPayment').addEventListener('click',check);check();timer=setInterval(check,5000);
})();