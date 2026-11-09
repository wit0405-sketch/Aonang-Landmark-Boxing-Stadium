(()=> {
 const id=new URLSearchParams(location.search).get('id'),box=document.getElementById('ticketFields');
 const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function load(){
  if(!id){box.textContent='Ticket reference is missing.';return}
  try{
   const r=await fetch('/api/tickets?id='+encodeURIComponent(id),{cache:'no-store'}),data=await r.json();
   if(!r.ok)throw new Error(data.error||'Ticket not found.');
   const t=data.ticket;if(t.status!=='valid')throw new Error('This ticket is not valid.');
   box.innerHTML='<div class="grid"><div class="field"><small>Ticket number</small><b>'+safe(t.id)+'</b></div><div class="field"><small>Guest</small><b>'+safe(t.name)+'</b></div><div class="field"><small>Event date</small><b>'+safe(t.eventDate)+'</b></div><div class="field"><small>Seats</small><b>'+safe((t.seats||[]).map(s=>s.id).join(', '))+'</b></div><div class="field"><small>Total paid</small><b>฿'+Number(t.amount||0).toLocaleString('en-US')+'</b></div><div class="field"><small>Status</small><b>PAID · VALID</b></div></div>';
   const qr=document.getElementById('ticketQr');if(window.QRCode)new QRCode(qr,{text:t.id,width:196,height:196,correctLevel:QRCode.CorrectLevel.M});else qr.textContent=t.id;
  }catch(e){box.textContent=e.message}
 }
 load();
})();