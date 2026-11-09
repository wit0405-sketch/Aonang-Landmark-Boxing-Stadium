const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function onRequestGet({request,env}){
 const id=new URL(request.url).searchParams.get('id');
 if(!id || id.length>64) return json({error:'Ticket ID is required.'},400);
 try{
  const row=await env.SEAT_LOCKS_DB.prepare("SELECT payload,status FROM issued_tickets WHERE id=?").bind(id).first();
  if(!row) return json({error:'Ticket not found.'},404);
  const ticket=JSON.parse(row.payload);
  return json({ticket:{...ticket,status:row.status}});
 }catch{return json({error:'Ticket service is unavailable.'},503)}
}
