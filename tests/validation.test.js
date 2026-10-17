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


function partialMatchState(format, source_kind, participantCount, mapCount) {
  const matchId = 'partial_match';
  const rows = Array.from({length: participantCount}, (_, i) => ({
    raw_name: 'Guest ' + i,
    player_id: null,
    kills: 10 + i,
    deaths: 5,
    assists: 2
  }));
  const mapIds = Array.from({length: mapCount}, (_, i) => 'partial_map_' + i);
  const maps = mapIds.map((mapId, i) => ({
    map_id: mapId,
    match_id: matchId,
    map_index: i + 1,
    map: ['mirage', 'nuke', 'inferno'][i],
    score: format === 'BO1' ? {team_a: 13, team_b: 8} : null,
    stats_available: format === 'BO1',
    player_stats: format === 'BO1' ? rows.map(row => ({...row})) : []
  }));
  const match = {
    match_id: matchId,
    format,
    source_kind,
    map_ids: mapIds,
    series_score: format === 'BO1' ? '1:0' : '2:0',
    series_aggregate_stats: format === 'BO1' ? [] : rows
  };
  return {players: [], maps, matches: [match], aliases: {}};
}

for (const count of [1, 9, 10]) {
  const detailed = partialMatchState('BO1', 'detailed_local', count, 1);
  assert.equal(validateBase(detailed).ok, true, 'BO1 should accept ' + count + ' match-only participants');
  assert.equal(detailed.players.length, 0, 'match-only participants must not be added to the player index');

  const compact = partialMatchState('BO3', 'compact_bo3', count, 2);
  assert.equal(validateBase(compact).ok, true, 'compact BO3 should accept ' + count + ' participants');
  assert.equal(compact.players.length, 0, 'compact participants must remain match-only');
}


const fs = require('node:fs');
const appSource = fs.readFileSync(require('node:path').join(__dirname, '..', 'app.js'), 'utf8');
assert.match(appSource, /id="newMaps" placeholder=/);
assert.doesNotMatch(appSource, /id="newMaps" value="mirage"/);
assert.match(appSource, /function updateMatchScoreHint\(\)/);
assert.match(appSource, /СЧЁТ КАРТЫ \(РАУНДЫ\)/);
assert.match(appSource, /СЧЁТ СЕРИИ/);
assert.doesNotMatch(appSource, /knownMaps\.has\(x\)/);

console.log('validation.test.js: PASS');
