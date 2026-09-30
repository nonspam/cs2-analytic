import { createClient } from "npm:@supabase/supabase-js@2";
import "../validation.js";
const validateBase=(globalThis as any).CS2Validation?.validateBase;

const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,x-client-info,apikey,content-type,x-cs2-api-key","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Content-Type":"application/json; charset=utf-8"};
const env=(n:string)=>Deno.env.get(n)||"", API_KEY=env("CS2_ADMIN_API_KEY"), BACKEND_KEY=env("SUPABASE_SERVICE_ROLE_KEY"), SUPABASE_URL=env("SUPABASE_URL");
if(!SUPABASE_URL||!BACKEND_KEY)throw new Error("backend secrets are not configured");
const db=createClient(SUPABASE_URL,BACKEND_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const json=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers});
const id=(x:unknown,max=128)=>{const s=String(x??"").trim();return s&&s.length<=max?s:null};
const clone=<T>(x:T):T=>JSON.parse(JSON.stringify(x));
function apply(s:any,o:any){
if(o?.kind==="map")s.maps.push(o.map);else if(o?.kind==="match")s.matches.push(o.match);else if(o?.kind==="player")s.players.push(o.player);else if(o?.kind==="aliases")Object.assign(s.aliases,o.aliases||{});
else if(["player_patch","match_patch","map_patch"].includes(o?.kind)){const key={player_patch:"players",match_patch:"matches",map_patch:"maps"}[o.kind],ik={player_patch:"player_id",match_patch:"match_id",map_patch:"map_id"}[o.kind],r=s[key].find((x:any)=>x?.[ik]===o[ik]);if(!r)throw Error("object not found: "+o.kind);Object.assign(r,o.patch||{})}else throw Error("unsupported operation: "+o?.kind);
}
async function row(){const r=await db.from("cs2_app_state").select("id,state,version,updated_at,updated_by").eq("id",1).single();if(r.error)throw r.error;return r.data}
async function commit(b:any){
const op=id(b.operation_id);if(!op)throw Error("operation_id is required");const ops=Array.isArray(b.operations)?b.operations:[];if(!ops.length||ops.length>100)throw Error("operations must contain 1-100 items");
const r=await row(),next=clone(r.state);for(const o of ops)apply(next,o);const v=validateBase(next);if(!v.ok)throw Error(v.error);
const a=b.audit||{},q=await db.rpc("commit_cs2_state",{p_expected_version:Number(r.version),p_state:next,p_operation_id:op,p_action:id(a.action,80)||"API_COMMIT",p_target:id(a.target),p_detail:a.detail&&typeof a.detail==="object"?a.detail:{},p_actor:id(b.actor,128)||"api",p_updated_by:null});
if(q.error)throw q.error;const out=Array.isArray(q.data)?q.data[0]:q.data;return {ok:true,operation_id:op,version:out.version,updated_at:out.updated_at};
}
Deno.serve(async req=>{
if(req.method==="OPTIONS")return new Response("ok",{headers});if(!API_KEY||req.headers.get("x-cs2-api-key")!==API_KEY)return json({ok:false,error:"Unauthorized"},401);
try{const u=new globalThis.URL(req.url);if(req.method==="GET"&&u.pathname.endsWith("/health"))return json({ok:true,service:"cs2-admin"});if(req.method==="GET"){const r=await row();return json({ok:true,state:r.state,version:r.version,updated_at:r.updated_at})}if(req.method!=="POST")return json({ok:false,error:"Method not allowed"},405);const b=await req.json();if(b.action==="validate"){const r=await row(),v=validateBase(r.state);if(!v.ok)return json({ok:false,error:v.error},400);return json({ok:true,version:r.version})}if(b.action==="commit")return json(await commit(b));return json({ok:false,error:"Unknown action"},400)}catch(e){const m=e instanceof Error?e.message:String(e);return json({ok:false,error:m},m==="version conflict"?409:400)}
});