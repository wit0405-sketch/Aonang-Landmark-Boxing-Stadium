const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:HEADERS});
const defaults=[
{id:'f1',date:'2026-10-25',title:'Thai Fight · 5 Rounds',type:'main',status:'upcoming'},
{id:'f2',date:'2026-10-26',title:'Muay Thai Super Fight',type:'co-main',status:'upcoming'},
{id:'f3',date:'2026-10-27',title:'Local Fight Night',type:'local',status:'upcoming'},
{id:'f4',date:'2026-10-28',title:'Thai Fight · 5 Rounds',type:'main',status:'upcoming'}];
const authorized=(r,e)=>Boolean(e?.FIGHTS_ADMIN_TOKEN&&r.headers.get('Authorization')===`Bearer ${e.FIGHTS_ADMIN_TOKEN}`);
function valid(list){return Array.isArray(list)&&list.length<=100&&list.every(f=>f&&typeof f.id==='string'&&f.id.length<=80&&typeof f.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(f.date)&&typeof f.title==='string'&&f.title.trim()&&f.title.length<=100&&['main','co-main','local'].includes(f.type)&&['upcoming','live','completed','cancelled'].includes(f.status||'upcoming')&&(f.description==null||(typeof f.description==='string'&&f.description.length<=500)))}
async function readSchedule(env){
 const d=env?.SEAT_LOCKS_DB;if(!d)throw new Error('D1 missing');
 const rows=await d.prepare('SELECT payload FROM fight_schedule ORDER BY event_date,id').all();
 if(rows.results?.length)return rows.results.map(r=>JSON.parse(r.payload));
 // Import the existing KV schedule once, preserving its data.
 if(env.fights_kv){const raw=await env.fights_kv.get('fight_schedule');if(raw){let list;try{list=JSON.parse(raw)}catch{}if(valid(list)){for(const f of list)await d.prepare('INSERT OR IGNORE INTO fight_schedule(id,event_date,payload) VALUES(?,?,?)').bind(f.id,f.date,JSON.stringify(f)).run();return list}}}
 return defaults;
}
export async function onRequestGet({env}){try{const rows=await env.SEAT_LOCKS_DB.prepare('SELECT payload FROM fight_schedule ORDER BY event_date,id').all();if(rows.results?.length)return json({fights:rows.results.map(r=>JSON.parse(r.payload)),initialized:true});const list=await readSchedule(env);return json({fights:list,initialized:false})}catch{return json({error:'D1 schedule storage is not configured. Check SEAT_LOCKS_DB and migration 0002.'},503)}}
export async function onRequestPut({request,env}){
 if(!authorized(request,env))return json({error:'Invalid admin key.'},401);
 let p;try{p=await request.json()}catch{return json({error:'Request must contain valid JSON.'},400)}
 if(!valid(p?.fights))return json({error:'Schedule data is invalid.'},400);
 try{const d=env.SEAT_LOCKS_DB;if(!d)throw new Error('D1 missing');
  await d.prepare('DELETE FROM fight_schedule').run();
  for(const f of p.fights)await d.prepare('INSERT INTO fight_schedule(id,event_date,payload) VALUES(?,?,?)').bind(f.id,f.date,JSON.stringify(f)).run();
  return json({ok:true,count:p.fights.length});
 }catch{return json({error:'Could not save schedule to D1. Apply migration 0002.'},503)}
}
