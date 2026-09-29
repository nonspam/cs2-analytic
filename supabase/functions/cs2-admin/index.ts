import { createClient } from "npm:@supabase/supabase-js@2";

const headers={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-cs2-api-key",
  "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
  "Content-Type":"application/json; charset=utf-8"
};
const env=(n:string)=>Deno.env.get(n)||"";
const API_KEY=env("CS2_ADMIN_API_KEY");
const BACKEND_KEY=env("SUPABASE_BACKEND_KEY");
const URL=env("SUPABASE_URL");
if(!URL||!BACKEND_KEY)throw new Error("backend secrets are not configured");
const db=createClient(URL,BACKEND_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const json=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers});
const clone=<T>(x:T):T=>JSON.parse(JSON.stringify(x));
const id=(x:unknown,max=128)=>{const s=String(x??"").trim();return s&&s.length<=max?s:null};

function apply(s:any,o:any){
  if(o?.kind==="map")s.maps.push(o.map);
  else if(o?.kind==="match")s.matches.push(o.match);
  else if(o?.kind==="player")s.players.push(o.player);
  else if(o?.kind==="aliases")Object.assign(s.aliases,o.aliases||{});
  else if(["player_patch","match_patch","map_patch"].includes(o?.kind)){
    const key={player_patch:"players",match_patch:"matches",map_patch:"maps"}[o.kind];
    const idkey={player_patch:"player_id",match_patch:"match_id",map_patch:"map_id"}[o.kind];
    const row=s[key].find((x:any)=>x?.[idkey]===o[idkey]);
    if(!row)throw Error("object not found: "+o.kind);
    Object.assign(row,o.patch||{});
  }else throw Error("unsupported operation: "+o?.kind);
}
async function row(){
  const r=await db.from("cs2_app_state").select("id,state,version,updated_at,updated_by").eq("id",1).single();
  if(r.error)throw r.error; return r.data;
}
function validate(b:any){
  if(!b||!Array.isArray(b.players)||!Array.isArray(b.maps)||!Array.isArray(b.matches)||!b.aliases||typeof b.aliases!=="object")throw Error("invalid state shape");
  const uniq=(a:any[],k:string)=>{const z=new Set();for(const x of a){if(!x?.[k]||z.has(x[k]))throw Error("duplicate/invalid "+k);z.add(x[k])}};
  uniq(b.players,"player_id");uniq(b.maps,"map_id");uniq(b.matches,"match_id");
  const pids=new Set(b.players.map((x:any)=>x.player_id)), mids=new Set(b.matches.map((x:any)=>x.match_id)), maps=new Map(b.maps.map((x:any)=>[x.map_id,x]));
  const used=new Set();
  for(const m of b.matches)for(const x of m.map_ids||[]){if(used.has(x))throw Error("map belongs to multiple matches");used.add(x)}
  for(const m of b.maps)if(!used.has(m.map_id))throw Error("orphan map");
  for(const [a,p] of Object.entries(b.aliases))if(!String(a).trim()||!pids.has(p))throw Error("invalid alias");
  for(const m of b.maps){if(!mids.has(m.match_id)||!maps.has(m.map_id))throw Error("invalid map relation");}
  for(const m of b.matches){
    if(!Array.isArray(m.map_ids)||!m.map_ids.length||new Set(m.map_ids).size!==m.map_ids.length)throw Error("invalid map_ids");
    if(m.format==="BO1"&&m.map_ids.length!==1)throw Error("BO1 must have one map");
    if(m.format==="BO3"&&(m.map_ids.length<2||m.map_ids.length>3))throw Error("BO3 must have 2-3 maps");
    if(!["BO1","BO3"].includes(m.format))throw Error("unsupported format");
    for(let i=0;i<m.map_ids.length;i++){const mp:any=maps.get(m.map_ids[i]);if(!mp||mp.match_id!==m.match_id||Number(mp.map_index)!==i+1)throw Error("invalid match/map relation")}
    if(m.source_kind==="compact_bo3"&&(!Array.isArray(m.series_aggregate_stats)||m.series_aggregate_stats.length!==10))throw Error("compact BO3 requires 10 rows");
  }
}
async function commit(b:any){
  const op=id(b.operation_id);if(!op)throw Error("operation_id is required");
  const ops=Array.isArray(b.operations)?b.operations:[];if(!ops.length||ops.length>100)throw Error("operations must contain 1-100 items");
  const r=await row();const next=clone(r.state);for(const o of ops)apply(next,o);validate(next);
  const a=b.audit||{};
  const q=await db.rpc("commit_cs2_state",{p_expected_version:Number(r.version),p_state:next,p_operation_id:op,p_action:id(a.action,80)||"API_COMMIT",p_target:id(a.target),p_detail:a.detail&&typeof a.detail==="object"?a.detail:{},p_actor:id(b.actor,128)||"api",p_updated_by:null});
  if(q.error)throw q.error;const out=Array.isArray(q.data)?q.data[0]:q.data;
  return {ok:true,operation_id:op,version:out.version,updated_at:out.updated_at};
}
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers});
  if(!API_KEY||req.headers.get("x-cs2-api-key")!==API_KEY)return json({ok:false,error:"Unauthorized"},401);
  try{
    const u=new URL(req.url);
    if(req.method==="GET"&&u.pathname.endsWith("/health"))return json({ok:true,service:"cs2-admin"});
    if(req.method==="GET"){const r=await row();return json({ok:true,state:r.state,version:r.version,updated_at:r.updated_at})}
    if(req.method!=="POST")return json({ok:false,error:"Method not allowed"},405);
    const b=await req.json();
    if(b.action==="validate"){const r=await row();validate(r.state);return json({ok:true,version:r.version})}
    if(b.action==="commit")return json(await commit(b));
    return json({ok:false,error:"Unknown action"},400);
  }catch(e){const m=e instanceof Error?e.message:String(e);return json({ok:false,error:m},m==="version conflict"?409:400)}
});
