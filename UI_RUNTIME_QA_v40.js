const fs=require('fs'),vm=require('vm');
const src0=fs.readFileSync('app.js','utf8');
const cut=src0.indexOf('window.openAddGame=');
if(cut<0) throw Error('window exports not found');
let src=src0.slice(0,cut);
const data={
  players:JSON.parse(fs.readFileSync('data/players.json')).players,
  maps:JSON.parse(fs.readFileSync('data/maps.json')).maps,
  matches:JSON.parse(fs.readFileSync('data/matches.json')).matches,
  aliases:JSON.parse(fs.readFileSync('data/aliases.json')).aliases
};
src=src.replace("const DB={players:[],maps:[],matches:[],aliases:{}};",`const DB=${JSON.stringify(data)};`);
const els=new Map();
const el=id=>{if(!els.has(id))els.set(id,{id,innerHTML:'',value:'',onclick:null,onchange:null,oninput:null,addEventListener(){}});return els.get(id)};
const document={
  querySelector(sel){return sel.startsWith('#')?el(sel.slice(1)):null},
  querySelectorAll(){return[]},
  body:{insertAdjacentHTML(){}},
  getElementById(id){return el(id)},
  createElement(){return {classList:{add(){},remove(){}},style:{}}}
};
const ctx={console,Math,Date,JSON,Set,Map,Blob:class{},URL:{createObjectURL(){return'blob:'},revokeObjectURL(){}},document,localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}};
ctx.window={CS5_EMBEDDED_DATA:{}};
vm.createContext(ctx);vm.runInContext(src,ctx);
const tests=[
  ['home',()=>ctx.home(el('view'))],['base',()=>ctx.base(el('view'))],['players',()=>ctx.players(el('view'))],
  ['compare',()=>ctx.compare(el('view'))],['maps',()=>ctx.maps(el('view'))],['maplab',()=>ctx.renderMapLab('mirage')],
  ['teams',()=>ctx.teams(el('view'))],['records',()=>ctx.records(el('view'))],['playerDetail',()=>ctx.openPlayerDetail('gletcher')],
  ['whyIndex',()=>ctx.openWhyIndex('gletcher')],['matchDetail',()=>ctx.openMatchDetail(ctx.latestMatch().match_id)]
];
const bad=[];
for(const [name,fn] of tests){try{fn()}catch(e){bad.push({name,error:e.message})}}
const baseline=ctx.index('gletcher');
const last=ctx.detailRows('gletcher').at(-1);
if(last){const changed=vm.runInContext(`(()=>{const m=DB.maps.find(m=>m.map_id==='${last.map_id}');const row=m.player_stats.find(s=>s.player_id==='gletcher');row.kills+=1;return index('gletcher')})()`,ctx);if(!(changed>baseline))bad.push({name:'derived-recalc',error:`Index did not increase after +1 kill: ${baseline} -> ${changed}`})}
console.log(JSON.stringify({PASS:bad.length===0,tests:tests.length,derivedRecalcTested:true,bad},null,2));
process.exitCode=bad.length?1:0;
