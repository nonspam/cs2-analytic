/* CS2 Analytics — Supabase cloud adapter.
   Loaded before app.js. Uses only the browser-safe publishable/anon key. */
(function(){
  const cfg=window.CS2_SUPABASE_CONFIG||{};
  const sdk=window.supabase;
  const configured=!!(sdk&&cfg.url&&cfg.key&&/^https:\/\/[^\s]+\.supabase\.co$/i.test(cfg.url));
  let client=null;
  let channel=null;
  let commitQueue=Promise.resolve();
  if(configured) client=sdk.createClient(cfg.url,cfg.key,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});

  const clone=x=>JSON.parse(JSON.stringify(x));
  function applyOp(s,op){
    const k=op?.kind;
    if(k==='map')s.maps.push(op.map);
    else if(k==='match')s.matches.push(op.match);
    else if(k==='player')s.players.push(op.player);
    else if(k==='aliases')Object.assign(s.aliases,op.aliases||{});
    else if(['player_patch','match_patch','map_patch'].includes(k)){
      const key={player_patch:'players',match_patch:'matches',map_patch:'maps'}[k];
      const idkey={player_patch:'player_id',match_patch:'match_id',map_patch:'map_id'}[k];
      const row=s[key].find(x=>x?.[idkey]===op[idkey]);
      if(!row)throw Error('Объект не найден: '+k);
      Object.assign(row,op.patch||{});
    } else throw Error('Неизвестная операция');
  }
  async function getRow(){
    if(!configured)throw Error('Supabase не настроен');
    const {data,error}=await client.from('cs2_app_state').select('id,state,version,updated_at,updated_by').eq('id',1).maybeSingle();
    if(error)throw error;
    if(!data)throw Error('В Supabase ещё нет начального состояния');
    return data;
  }
  async function load(){
    if(!configured)return null;
    const row=await getRow();
    return {...clone(row.state),updated_at:row.updated_at,cloud_version:row.version};
  }
  async function isAdmin(){
    if(!configured)return false;
    const {data:{session}}=await client.auth.getSession();
    if(!session)return false;
    const {data,error}=await client.rpc('is_cs2_admin');
    if(error)throw error;
    return data===true;
  }
  async function signIn(email,password){
    if(!configured)throw Error('Supabase не настроен');
    const {data,error}=await client.auth.signInWithPassword({email,password});
    if(error)throw error;
    if(!data.session)throw Error('Сессия не создана');
    if(!(await isAdmin())){await client.auth.signOut();throw Error('Этот аккаунт не добавлен как администратор сайта.');}
    return data;
  }
  async function signOut(){if(configured)await client.auth.signOut()}
  function subscribe(onChange){
    if(!configured||channel)return;
    channel=client.channel('cs2-app-state-live')
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'cs2_app_state',filter:'id=eq.1'},payload=>onChange?.(payload))
      .subscribe();
  }
  function unsubscribe(){if(channel&&client){client.removeChannel(channel);channel=null}}
  function commit(ops,audit){
    if(!configured)return Promise.reject(Error('Supabase не настроен'));
    const task=commitQueue.then(async()=>{
      if(!(await isAdmin()))throw Error('Нет прав администратора');
      const row=await getRow();
      const next=clone(row.state);
      for(const op of (ops||[]))applyOp(next,op);
      if(audit){next.audit=Array.isArray(next.audit)?next.audit.slice(-499):[];next.audit.push(audit);next.audit=next.audit.slice(-500)}
      const {data,error}=await client.from('cs2_app_state')
        .update({state:next,version:Number(row.version||0)+1,updated_at:new Date().toISOString(),updated_by:(await client.auth.getUser()).data.user?.id||null})
        .eq('id',1).eq('version',row.version)
        .select('version,updated_at,state').maybeSingle();
      if(error)throw error;
      if(!data)throw Error('Конфликт обновления: база изменилась. Повторите действие.');
      return data;
    });
    commitQueue=task.catch(()=>{});
    return task;
  }
  window.CS2Cloud={configured,load,isAdmin,signIn,signOut,subscribe,unsubscribe,commit};
})();
