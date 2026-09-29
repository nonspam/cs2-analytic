/* CS2 Analytics — shared base-state validation. */
(function(root){
  function validateBase(b){
    if(!b||!Array.isArray(b.players)||!Array.isArray(b.maps)||!Array.isArray(b.matches)||!b.aliases||typeof b.aliases!=='object'||Array.isArray(b.aliases))return {ok:false,error:'state shape is invalid'};
    try{
      const uniq=(arr,key)=>{const s=new Set();for(const v of arr){const id=v&&v[key];if(!id||s.has(id))return false;s.add(id)}return true};
      if(!uniq(b.players,'player_id'))return {ok:false,error:'duplicate/invalid player_id'};
      if(!uniq(b.maps,'map_id'))return {ok:false,error:'duplicate/invalid map_id'};
      if(!uniq(b.matches,'match_id'))return {ok:false,error:'duplicate/invalid match_id'};
      if(b.players.some(p=>typeof p.player_id!=='string'||!/^\\p{L}+/u.test(p.player_id)))return {ok:false,error:'invalid player_id'};
      const pids=new Set(b.players.map(p=>p.player_id)),mids=new Set(b.matches.map(m=>m.match_id));
      const mapById=new Map(b.maps.map(m=>[m.map_id,m])),listedMapIds=new Set();
      for(const m of b.matches)for(const id of (Array.isArray(m.map_ids)?m.map_ids:[])){if(listedMapIds.has(id))return {ok:false,error:'map belongs to multiple matches'};listedMapIds.add(id)}
      for(const mp of b.maps)if(!listedMapIds.has(mp.map_id))return {ok:false,error:'orphan map: '+mp.map_id};
      for(const [alias,pid] of Object.entries(b.aliases))if(typeof alias!=='string'||!alias.trim()||typeof pid!=='string'||!pids.has(pid))return {ok:false,error:'invalid alias mapping'};
      for(const mp of b.maps){
        if(!mids.has(mp.match_id)||!mapById.has(mp.map_id))return {ok:false,error:'invalid map relation'};
        if(!Number.isInteger(Number(mp.map_index))||Number(mp.map_index)<1)return {ok:false,error:'invalid map_index'};
        const rows=Array.isArray(mp.player_stats)?mp.player_stats:[];
        if(mp.stats_available===true&&rows.length===0)return {ok:false,error:'detailed map has no player_stats'};
        if(mp.stats_available===false&&rows.length>0)return {ok:false,error:'compact map contains player_stats'};
        const seen=new Set();
        for(const st of rows){if(!st||!Number.isFinite(Number(st.kills))||!Number.isFinite(Number(st.deaths))||!Number.isFinite(Number(st.assists)))return {ok:false,error:'invalid KDA'};if(st.player_id!=null&&!pids.has(st.player_id))return {ok:false,error:'unknown player'};const key=st.player_id||'raw:'+(st.raw_name||'');if(seen.has(key))return {ok:false,error:'duplicate player stats'};seen.add(key)}
      }
      for(const m of b.matches){
        if(!Array.isArray(m.map_ids)||!m.map_ids.length||new Set(m.map_ids).size!==m.map_ids.length)return {ok:false,error:'invalid map_ids'};
        if(m.format==='BO1'&&m.map_ids.length!==1)return {ok:false,error:'BO1 must have one map'};
        if(m.format==='BO3'&&(m.map_ids.length<2||m.map_ids.length>3))return {ok:false,error:'BO3 must have 2-3 maps'};
        if(m.format!=='BO1'&&m.format!=='BO3')return {ok:false,error:'unsupported format'};
        for(let i=0;i<m.map_ids.length;i++){const mp=mapById.get(m.map_ids[i]);if(!mp||mp.match_id!==m.match_id||Number(mp.map_index)!==i+1)return {ok:false,error:'match/map relation invalid'}}
        const sas=Array.isArray(m.series_aggregate_stats)?m.series_aggregate_stats:[];if(m.source_kind==='compact_bo3'&&sas.length!==10)return {ok:false,error:'compact BO3 must contain 10 rows'};
      }
      return {ok:true};
    }catch(e){return {ok:false,error:e?.message||'validation failed'}}
  }
  const api={validateBase,assertBase(b){const r=validateBase(b);if(!r.ok)throw Error(r.error);return b}};
  if(root)root.CS2Validation=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
