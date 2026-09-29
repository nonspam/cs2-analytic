const assert=require('node:assert/strict');
const {validateBase}=require('../validation');

const player={player_id:'p1'};
const map={map_id:'m1',match_id:'x1',map_index:1,stats_available:false};
const match={match_id:'x1',format:'BO1',map_ids:['m1']};
const valid={players:[player],maps:[map],matches:[match],aliases:{}};

assert.equal(validateBase(valid).ok,true);
assert.equal(validateBase({...valid,matches:[{...match,map_ids:['missing']}]}).ok,false);
assert.equal(validateBase({...valid,maps:[{...map,map_index:2}]}).ok,false);
assert.equal(validateBase({...valid,matches:[{...match,format:'BO3'}]}).ok,false);
assert.equal(validateBase({...valid,aliases:{alias:'missing'}}).ok,false);

console.log('validation.test.js: PASS');
