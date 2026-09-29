const assert=require('node:assert/strict');

function applyOp(s,op){
  if(op.kind==='player')s.players.push(op.player);
  else if(op.kind==='map')s.maps.push(op.map);
  else if(op.kind==='match')s.matches.push(op.match);
  else if(op.kind==='aliases')Object.assign(s.aliases,op.aliases||{});
  else if(['player_patch','match_patch','map_patch'].includes(op.kind)){
    const key={player_patch:'players',match_patch:'matches',map_patch:'maps'}[op.kind];
    const idkey={player_patch:'player_id',match_patch:'match_id',map_patch:'map_id'}[op.kind];
    const row=s[key].find(x=>x[idkey]===op[idkey]);
    if(!row)throw Error('not found');
    Object.assign(row,op.patch||{});
  } else throw Error('unsupported operation');
}
const s={players:[],maps:[],matches:[],aliases:{}};
applyOp(s,{kind:'player',player:{player_id:'p1'}});
applyOp(s,{kind:'aliases',aliases:{nick:'p1'}});
applyOp(s,{kind:'player_patch',player_id:'p1',patch:{name:'Player 1'}});
assert.equal(s.players[0].name,'Player 1');
assert.throws(()=>applyOp(s,{kind:'player_patch',player_id:'missing',patch:{}}));
assert.throws(()=>applyOp(s,{kind:'nope'}));
console.log('operations.test.js: PASS');
