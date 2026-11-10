// Supabase finto per i test: tiene i dati nel localStorage del browser di prova (nessuna rete).
(function(){
let uid=window.__uid||null; const KEY='fdb';
const db=()=>JSON.parse(localStorage.getItem(KEY)||'{}'), save=d=>localStorage.setItem(KEY,JSON.stringify(d));
const clone=x=>JSON.parse(JSON.stringify(x));
const rid=()=>Math.random().toString(16).slice(2,10)+'-0000-4000-8000-'+Math.random().toString(16).slice(2,14);
function tbl(d,t){return d[t]=d[t]||[];}
function qb(table){
  let op='select',filt=[],payload=null,single=false;
  const o={select(){return o},eq(c,v){filt.push(r=>r[c]===v);return o},in(c,a){filt.push(r=>a.includes(r[c]));return o},order(){return o},limit(){return o},
    maybeSingle(){single=true;return o},single(){single=true;return o},upsert(p){op='upsert';payload=p;return o},update(p){op='update';payload=p;return o},delete(){op='delete';return o},insert(p){op='insert';payload=p;return o},
    then(a,b){return run().then(a,b)}};
  async function run(){
    const d=db(),rows=tbl(d,table),m=rows.filter(r=>filt.every(f=>f(r)));
    if(op==='select'){const out=clone(m);return {data:single?(out[0]||null):out,error:null};}
    if(op==='update'){m.forEach(r=>Object.assign(r,clone(payload)));save(d);return {data:null,error:null};}
    if(op==='delete'){d[table]=rows.filter(r=>!m.includes(r));save(d);return {data:null,error:null};}
    if(op==='insert'||op==='upsert'){
      for(const p of [].concat(payload)){
        let ex=null;
        if(op==='upsert'){ex=rows.find(r=>table==='titles'?(r.user_id===p.user_id&&r.tmdb_key===p.tmdb_key):table==='settings'?r.user_id===p.user_id:false);}
        if(ex)Object.assign(ex,clone(p));else rows.push(clone(p));
      }
      save(d);return {data:null,error:null};
    }
  }
  return o;
}
const S_=(d,id)=>tbl(d,'settings').find(s=>s.user_id===id)||{};
const fr=d=>tbl(d,'friendships');
const isFr=(d,a,b)=>fr(d).some(f=>f.status==='ok'&&((f.a===a&&f.b===b)||(f.a===b&&f.b===a)));
const err=m=>({data:null,error:{message:m}});
const rpcs={
  device_send(d,a){tbl(d,'dev_msgs').push({user_id:uid,dev:a.p_dev,item:a.p_item,t:Date.now()});return null;},
  device_poll(d,a){const m=tbl(d,'dev_msgs').filter(x=>x.user_id===uid&&x.dev!==a.p_dev);if(!m.length)return null;d.dev_msgs=tbl(d,'dev_msgs').filter(x=>!(x.user_id===uid&&x.dev!==a.p_dev));return m[m.length-1].item;},
  my_friend_code(d){let s=tbl(d,'settings').find(x=>x.user_id===uid);if(!s){s={user_id:uid};d.settings.push(s);}if(!s.friend_code)s.friend_code=uid.toUpperCase()+'CODE';return s.friend_code;},
  friend_request(d,a){const u=tbl(d,'settings').find(s=>s.friend_code===String(a.p_code).toUpperCase());if(!u)return err('Codice non trovato');if(u.user_id===uid)return err('Questo è il tuo codice');
    const rev=fr(d).find(f=>f.a===u.user_id&&f.b===uid);if(rev){rev.status='ok';return 'ok';}fr(d).push({a:uid,b:u.user_id,status:'pending'});return 'pending';},
  friend_respond(d,a){if(a.p_accept){const f=fr(d).find(f=>f.a===a.p_from&&f.b===uid);if(f)f.status='ok';}else d.friendships=fr(d).filter(f=>!(f.a===a.p_from&&f.b===uid)&&!(f.a===uid&&f.b===a.p_from));return null;},
  friend_list(d){return fr(d).filter(f=>f.a===uid||f.b===uid).map(f=>{const o=f.a===uid?f.b:f.a,s=S_(d,o);return {user_id:o,name:s.name,avatar:s.avatar||0,status:f.status,incoming:f.b===uid,sharing:!!s.share_activity,username:s.username||null};});},
  set_username(d,a){const n=String(a.p_name).toLowerCase();if(!/^[a-z0-9_][a-z0-9_.]{1,18}[a-z0-9_]$/.test(n))return err('Username non valido');if(tbl(d,'settings').some(s=>s.username===n&&s.user_id!==uid))return err('Username già in uso');let s=tbl(d,'settings').find(x=>x.user_id===uid);if(!s){s={user_id:uid};d.settings.push(s);}s.username=n;return n;},
  username_free(d,a){return !tbl(d,'settings').some(s=>s.username===String(a.p_name).toLowerCase()&&s.user_id!==uid);},
  community_recs(d,a){window.__com=(window.__com||0)+1;return [{tmdb_key:'movie:1077',title:'Comunità',poster:'/p77.jpg',media:'movie',users:5}];},
  friend_compat(d){const out=[];fr(d).filter(f=>f.status==='ok'&&(f.a===uid||f.b===uid)).forEach(f=>{const o=f.a===uid?f.b:f.a,s=S_(d,o);if(!s.share_activity)return;const mine=tbl(d,'titles').filter(t=>t.user_id===uid&&t.watched&&t.stars),their=tbl(d,'titles').filter(t=>t.user_id===o&&t.watched&&t.stars);let n=0,sim=0,loves=[],fights=[];mine.forEach(m=>{const t=their.find(x=>x.tmdb_key===m.tmdb_key);if(!t)return;n++;sim+=100-Math.abs(m.stars-t.stars)*25;if(m.stars>=4&&t.stars>=4)loves.push({k:m.tmdb_key,t:m.title,p:m.poster});if(Math.abs(m.stars-t.stars)>=2)fights.push({k:m.tmdb_key,t:m.title,p:m.poster,a:m.stars,b:t.stars});});const forMe=their.filter(t=>t.stars>=4&&!mine.some(m=>m.tmdb_key===t.tmdb_key)).map(t=>({k:t.tmdb_key,t:t.title,p:t.poster,b:t.stars}));out.push({user_id:o,name:s.name,username:s.username,avatar:s.avatar||0,common:n,score:n?Math.round((sim+150)/(n+3)):null,loves,fights,for_me:forMe});});return out;},
  set_friend_req(d,a){let s=tbl(d,'settings').find(x=>x.user_id===uid);s.friend_req=a.p_mode;return null;},
  user_search(d,a){const q=String(a.p_q).toLowerCase();if(q.length<3)return [];return tbl(d,'settings').filter(s=>s.user_id!==uid&&s.username&&s.username.startsWith(q)&&(s.friend_req||'all')==='all').map(s=>{const f=fr(d).find(f=>(f.a===uid&&f.b===s.user_id)||(f.a===s.user_id&&f.b===uid));return {user_id:s.user_id,username:s.username,name:s.name,avatar:s.avatar||0,rel:!f?'none':f.status==='ok'?'friend':f.a===uid?'sent':'received'};});},
  friend_request_user(d,a){const u=S_(d,a.p_user);if((u.friend_req||'all')!=='all')return err('Questa persona non accetta richieste di amicizia');const rev=fr(d).find(f=>f.a===a.p_user&&f.b===uid);if(rev){rev.status='ok';return 'ok';}fr(d).push({a:uid,b:a.p_user,status:'pending'});return 'pending';},
  friend_feed(d){const out=[];fr(d).filter(f=>f.status==='ok'&&(f.a===uid||f.b===uid)).forEach(f=>{const o=f.a===uid?f.b:f.a,s=S_(d,o);if(!s.share_activity)return;tbl(d,'titles').filter(t=>t.user_id===o&&t.watched).slice(0,6).forEach(t=>out.push({user_id:o,name:s.name,avatar:s.avatar||0,tmdb_key:t.tmdb_key,title:t.title,poster:t.poster,stars:t.stars,watched_on:t.watched_on}));});return out;},
  friend_send(d,a){if(!isFr(d,uid,a.p_to))return err('Potete scambiarvi consigli solo da amici');tbl(d,'msgs').push({id:rid(),from_user:uid,to_user:a.p_to,kind:a.p_kind,item:a.p_item,code:a.p_code,note:a.p_note,seen:false,created_at:new Date().toISOString()});return null;},
  friend_inbox(d){return tbl(d,'msgs').filter(m=>m.to_user===uid).map(m=>{const s=S_(d,m.from_user);return Object.assign({},m,{name:s.name,avatar:s.avatar||0});});},
  friend_msg_done(d,a){const m=tbl(d,'msgs').find(m=>m.id===a.p_id&&m.to_user===uid);if(m){if(a.p_delete)d.msgs=d.msgs.filter(x=>x!==m);else m.seen=true;}return null;},
  friend_title(d,a){const out=[];fr(d).filter(f=>f.status==='ok'&&(f.a===uid||f.b===uid)).forEach(f=>{const o=f.a===uid?f.b:f.a,s=S_(d,o);if(!s.share_activity)return;const t=tbl(d,'titles').find(t=>t.user_id===o&&t.tmdb_key===a.p_key&&t.watched);if(t)out.push({user_id:o,name:s.name,avatar:s.avatar||0,stars:t.stars});});return out;},
  create_room(d,a){const r={id:rid(),code:rid().slice(0,8).toUpperCase(),kind:a.p_kind,name:a.p_name,owner:uid,items:a.p_items||[]};tbl(d,'rooms').push(r);tbl(d,'room_members').push({room_id:r.id,user_id:uid,name:a.p_uname,avatar:a.p_avatar,votes:{}});return r;},
  join_room(d,a){const r=tbl(d,'rooms').find(r=>r.code===String(a.p_code).toUpperCase());if(!r)return err('Codice non trovato');if(!tbl(d,'room_members').some(m=>m.room_id===r.id&&m.user_id===uid))d.room_members.push({room_id:r.id,user_id:uid,name:a.p_uname,avatar:a.p_avatar,votes:{}});return r;},
  room_contribute(d,a){const r=tbl(d,'rooms').find(r=>r.id===a.p_room);(a.p_items||[]).forEach(i=>{if(!r.items.some(e=>e.k===i.k))r.items.push(i);});return null;},
  room_edit(d,a){const r=tbl(d,'rooms').find(r=>r.id===a.p_room);if(a.p_op==='add'){if(!r.items.some(e=>e.k===a.p_item.k))r.items.push(a.p_item);}else r.items=r.items.filter(e=>e.k!==a.p_item.k);return r.items;}
};
const mine=t=>{ // le RLS: stanze/membri visibili solo ai membri
  return t;};
let user=uid?{id:uid,email:uid+'@x.it',user_metadata:{}}:null;
const sess=()=>user?{user,access_token:'AT-'+uid+'-'+(window.__n=(window.__n||0)+1),refresh_token:'RT-'+uid}:null;
const as=id=>{uid=id;user=id?{id,email:id+'@x.it',user_metadata:{}}:null;window.__uid=id;return sess();};
rpcs.friend_suggest=(d)=>[{user_id:'c',username:'giuly',name:'Giulia',avatar:0,mutual:3,sim:null,via:'Marta'},{user_id:'d',username:'marcop',name:'Marco',avatar:1,mutual:0,sim:82,via:null},{user_id:'e',username:'sarina',name:'Sara',avatar:2,mutual:1,sim:null,via:'Marta'}];
rpcs.tv_link_new=(d,a)=>{if(!/^[A-Za-z0-9]{24}$/.test(a.p_id))return err('Dati non validi');const c=String(1000+Math.floor(Math.random()*9000));tbl(d,'tv_links').push({id:a.p_id,sec:a.p_secret,code:c,th:null,t:Date.now()});return c;};
rpcs.tv_link_poll=(d,a)=>{const r=tbl(d,'tv_links').find(x=>x.id===a.p_id&&x.sec===a.p_secret);if(!r)return 'gone';if(!r.th)return 'wait';d.tv_links=d.tv_links.filter(x=>x!==r);return r.th;};
window.supabase={createClient:()=>({
  auth:{getSession:async()=>({data:{session:sess()}}),getUser:async()=>({data:{user}}),onAuthStateChange:(cb)=>{window.__acb=cb;return {data:{subscription:{unsubscribe(){}}}}},signOut:async(o)=>{window.__so=o;as(null);return {}},
    setSession:async(t)=>{const m=/^RT-(\w+)$/.exec(t.refresh_token||'');if(!m||(window.__revoked||[]).includes(m[1]))return {data:{session:null},error:{message:'invalid'}};return {data:{session:as(m[1])},error:null};},
    signInWithOtp:async(o)=>{window.__otp=o;return {error:null}},
    verifyOtp:async(o)=>{if(o.token_hash){const m=/^TH:(\w+)$/.exec(o.token_hash);if(!m||o.type!=='magiclink')return {data:{},error:{message:'bad'}};return {data:{session:as(m[1])},error:null};}
      if(o.token==='123456')return {data:{session:as(o.email.split('@')[0])},error:null};return {data:{},error:{message:'bad'}};},signInWithPassword:async()=>({}),updateUser:async()=>({})},
  storage:{from:()=>({createSignedUrl:async(p)=>({data:{signedUrl:'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22/>'}}),upload:async()=>({data:{},error:null}),getPublicUrl:()=>({data:{publicUrl:''}}),remove:async()=>({})})},
  from:t=>qb(t),
  functions:{invoke:async(n,o)=>{if(n!=='tv-login')return {error:{message:'x'}};const d=db(),r=tbl(d,'tv_links').find(x=>x.id===o.body.link);const bad=m=>({error:{message:'e',context:{json:async()=>({error:m})}}});
    if(!user)return bad('Accedi');if(!r)return bad('Il QR è scaduto');if(r.code!==o.body.code)return bad('Il numero non corrisponde a quello sulla TV');r.th='TH:'+uid;save(d);window.__linked=1;return {data:{ok:true},error:null};}},
  rpc:async(n,a)=>{const d=db();for(const k of ['settings','titles','friendships','rooms','room_members','msgs'])tbl(d,k);const r=rpcs[n](d,a||{});save(d);if(r&&r.error!==undefined&&r.data===null)return r;return {data:r,error:null};}
})};
})();
