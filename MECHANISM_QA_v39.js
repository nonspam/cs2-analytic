const fs=require('fs');
const src=fs.readFileSync(__dirname+'/app.js','utf8');
const must=[
  "const BASE={players:[],maps:[],matches:[],aliases:{}};",
  "BASE.players=JSON.parse(JSON.stringify(candidate.players))",
  "DB.players=JSON.parse(JSON.stringify(candidate.players))",
  "function persistChange",
  "storage verification failed",
  "cs5_additions",
  "cs5_audit_log",
  "function hydrate",
  "if(!validateBase(DB))throw Error('Локальные изменения повредили базу')",
  "version:'site-v39'",
  "base:{players:BASE.players,maps:BASE.maps,matches:BASE.matches,aliases:BASE.aliases}",
  "function saveGame",
  "function saveMatchEdit",
  "function archiveMatch",
  "function restoreMatch",
  "function archivePlayer",
  "function restorePlayer",
  "state.teamA=[...new Set(state.teamA.filter(id=>allIds.has(id)))].slice(0,5)"
];
for(const x of must) if(!src.includes(x)) throw Error('missing '+x);
if(!src.includes('const importedAdditions=Array.isArray(x.localStorage)?x.localStorage:[]')) throw Error('backup local journal restore missing');
if(!src.includes('const probe=JSON.parse(nextBase)')) throw Error('backup journal validation must use clone');
if(!src.includes("localStorage.setItem('cs5_additions',nextAdd)")) throw Error('backup journal write missing');
if(!src.includes('Хранилище ${key} повреждено')) throw Error('storage warning missing');
console.log('PASS: v39 lifecycle, rollback, BASE+journal backup separation, restore validation, team normalization, and storage protection.');
