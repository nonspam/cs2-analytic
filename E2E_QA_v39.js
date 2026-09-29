const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=__dirname;
const DB0={players:JSON.parse(fs.readFileSync(root+'/data/players.json')).players,maps:JSON.parse(fs.readFileSync(root+'/data/maps.json')).maps,matches:JSON.parse(fs.readFileSync(root+'/data/matches.json')).matches,aliases:JSON.parse(fs.readFileSync(root+'/data/aliases.json')).aliases};
class LS{constructor(){this.m=new Map()}getItem(k){return this.m.has(k)?this.m.get(k):null}setItem(k,v){this.m.set(k,String(v))}removeItem(k){this.m.delete(k)}}
const els={}; const generic=()=>({value:'',innerHTML:'',textContent:'',className:'',classList:{add(){},remove(){},toggle(){}},style:{},onclick:null,insertAdjacentHTML(){},remove(){},querySelector(){return null},querySelectorAll(){return []},addEventListener(){}}); const document={querySelector:s=>els[s]||generic(),querySelectorAll:s=>[],getElementById:s=>els['#'+s]|| (s==='toast'?els['#toast']||(els['#toast']={textContent:'',classList:{add(){},remove(){}}}):generic()),createElement:tag=>({tag,click(){},set href(v){this._href=v},get href(){return this._href},classList:{add(){},remove(){}},appendChild(){}}),body:{appendChild(){}}};
const localStorage=new LS(); const window={};
const ctx={window,document,localStorage,console,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Blob:class{constructor(parts){this.parts=parts}},FileReader:class{},setTimeout,clearTimeout,Date,JSON,Math,Number,String,RegExp,Set,Map,Promise};
vm.createContext(ctx);
let code=fs.readFileSync(root+'/app.js','utf8').replace(/\nload\(\);\s*$/,'\n'); code += '\nthis.__cs5={DB,BASE,state,validateBase,activePlayers,activeMatches,latestMatch,latestDetailedMap,matchMaps,saveGame,saveMatchEdit,archiveMatch,restoreMatch};';
vm.runInContext(code,ctx,{filename:'app.js'});
const C=ctx.__cs5; const DB=C.DB, BASE=C.BASE, state=C.state;
Object.assign(DB,JSON.parse(JSON.stringify(DB0))); Object.assign(BASE,JSON.parse(JSON.stringify(DB0)));
function assertv(x,msg){assert.ok(x,msg)}
assertv(C.validateBase(DB),'baseline validateBase');
assert.strictEqual(DB.maps.length,66); assert.strictEqual(DB.matches.length,32); assert.strictEqual(C.activeMatches().length,32);
// stubs
C.closeModal=()=>{}; C.render=()=>{}; C.toast=(m)=>{ctx.__toast=String(m)};
function set(id,v){els['#'+id]={value:v}}
state.tab='settings'; const ids=C.activePlayers().slice(0,10).map(p=>p.player_id); assert.strictEqual(ids.length,10);
set('newFormat','BO1');set('newMaps','mirage');set('newPlayedAt','2026-09-28T20:00');set('newScore','13:10');set('newRows',ids.map(p=>`${p} 20/15/5`).join('\n'));
C.saveGame();
assert.strictEqual(DB.matches.length,33,'match created'); assert.strictEqual(DB.maps.length,67,'map created'); assertv(C.validateBase(DB),'post-create valid');
let added=JSON.parse(localStorage.getItem('cs5_additions')); assert.strictEqual(added.length,2,'create persists map+match');
let lm=C.latestMatch(); let lmap=C.latestDetailedMap(lm); assert.strictEqual(lmap.score.team_a,13);assert.strictEqual(lmap.score.team_b,10);assert.strictEqual(lmap.player_stats.length,10);
// all ten got +20 kills etc
assert.strictEqual(lmap.player_stats.reduce((s,x)=>s+x.kills,0),200);
// edit BO1 and verify recalculation source
set('editPlayedAt','2026-09-28T21:00');set('editScore','14:12');set('editRows',ids.map(p=>`${p} 21/14/6`).join('\n'));C.saveMatchEdit(lm.match_id);lm=C.latestMatch();lmap=C.latestDetailedMap(lm);assert.strictEqual(lmap.score.team_a,14);assert.strictEqual(lmap.score.team_b,12);assert.strictEqual(lmap.player_stats.reduce((s,x)=>s+x.kills,0),210);assertv(C.validateBase(DB),'post-edit valid');
// compact BO3 create path
set('newFormat','BO3_COMPACT');set('newMaps','nuke,dust2,mirage');set('newPlayedAt','2026-09-28T22:00');set('newScore','2:1');set('newRows',ids.map(p=>`${p} 30/25/8`).join('\n'));C.saveGame();assert.strictEqual(DB.matches.length,34);assert.strictEqual(DB.maps.length,70);const cm=C.latestMatch();assert.strictEqual(cm.source_kind,'compact_bo3');assert.strictEqual(cm.series_aggregate_stats.length,10);assert.strictEqual(C.matchMaps(cm).filter(x=>x.stats_available).length,0);assertv(C.validateBase(DB),'post-compact valid');
C.archiveMatch(cm.match_id);assert.strictEqual(C.activeMatches().some(x=>x.match_id===cm.match_id),false);C.restoreMatch(cm.match_id);assert.strictEqual(C.activeMatches().some(x=>x.match_id===cm.match_id),true);assertv(C.validateBase(DB),'post-compact archive/restore valid');
// archive/restore lifecycle
C.archiveMatch(lm.match_id); assert.strictEqual(C.activeMatches().some(x=>x.match_id===lm.match_id),false); assertv(C.validateBase(DB),'post-archive valid');
C.restoreMatch(lm.match_id); assert.strictEqual(C.activeMatches().some(x=>x.match_id===lm.match_id),true); assertv(C.validateBase(DB),'post-restore valid');
// replay additions into fresh base
const replay=JSON.parse(JSON.stringify(DB0));
for(const op of JSON.parse(localStorage.getItem('cs5_additions'))){
 if(op.kind==='map') replay.maps.push(op.map); else if(op.kind==='match') replay.matches.push(op.match); else if(op.kind==='player') replay.players.push(op.player); else if(op.kind==='aliases') Object.assign(replay.aliases,op.aliases); else if(op.kind==='player_patch'){const q=replay.players.find(x=>x.player_id===op.player_id);assertv(q,'replay player patch target')} else if(op.kind==='match_patch'){const q=replay.matches.find(x=>x.match_id===op.match_id);assertv(q,'replay match patch target');Object.assign(q,op.patch)} else if(op.kind==='map_patch'){const q=replay.maps.find(x=>x.map_id===op.map_id);assertv(q,'replay map patch target');Object.assign(q,op.patch)}
 if(op.kind==='player_patch'){Object.assign(replay.players.find(x=>x.player_id===op.player_id),op.patch)}
}
assertv(C.validateBase(replay),'replayed state valid'); assert.deepStrictEqual(replay, JSON.parse(JSON.stringify(DB)),'replay must reproduce exact hydrated DB'); assert.strictEqual(replay.matches.length,34); assert.strictEqual(replay.maps.length,70);
// backup export semantic: BASE + additions, not hydrated DB
let payload={version:'site-v39',base:{players:BASE.players,maps:BASE.maps,matches:BASE.matches,aliases:BASE.aliases},localStorage:JSON.parse(localStorage.getItem('cs5_additions')),audit:[]};
assert.strictEqual(payload.base.matches.length,32,'backup base remains raw');assert.strictEqual(payload.localStorage.length,JSON.parse(localStorage.getItem('cs5_additions')).length);
console.log(JSON.stringify({PASS:true,baseline:{maps:66,matches:32,players:11},afterCreate:{maps:DB.maps.length,matches:DB.matches.length,adds:added.length},latest:{score:lmap.score,players:lmap.player_stats.length,totalKills:200},archiveRestore:true,replayValid:true,backupBaseMatches:payload.base.matches.length,backupOps:payload.localStorage.length},null,2));
