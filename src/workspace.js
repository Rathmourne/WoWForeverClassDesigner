(function(global){
  'use strict';
  const C=global.TalentForgeCore||require('./core.js');
  const prefix='talent-forge-mode-handoff-',indexKey='talent-forge-class-backup-index';
  function signature(c){const copy=C.clone(c);delete copy.ranks;let hash=2166136261;
    const text=JSON.stringify(copy,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
    for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return(hash>>>0).toString(36);
  }
  function checked(c){return C.validateArrowLayouts(C.validateProject({schemaVersion:1,classes:[C.clone(c)]})).classes[0];}
  function stage(storage,c){
    const record=checked(c),classText=JSON.stringify(record),payload=JSON.stringify({createdAt:Date.now(),class:record});
    if(payload.length>4*1024*1024)throw Error('This class is too large to switch views. Export it to keep a backup.');
    const keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(prefix))keys.push(key);}
    const pending=[];
    for(const key of keys)try{
      const saved=JSON.parse(storage.getItem(key));
      if(Date.now()-saved.createdAt>24*60*60*1000)storage.removeItem(key);
      else if(JSON.stringify(saved.class)===classText){storage.setItem(key,payload);return key.slice(prefix.length);}
      else pending.push({key,time:saved.createdAt});
    }catch{}
    pending.sort((a,b)=>a.time-b.time);
    while(pending.length>7)storage.removeItem(pending.shift().key);
    const id=crypto.randomUUID();storage.setItem(prefix+id,payload);return id;
  }
  function receive(storage,id){
    if(!id)return null;if(!/^[a-f0-9-]{36}$/.test(id))throw Error('The class handoff is invalid.');
    const raw=storage.getItem(prefix+id);if(!raw)throw Error('This class handoff is no longer available. Open the class and switch modes again.');
    if(raw.length>4*1024*1024)throw Error('The class handoff is too large.');
    return checked(JSON.parse(raw).class);
  }
  function previous(storage,classId){
    try{const index=JSON.parse(storage.getItem(indexKey)||'{}'),key=index[classId];return key?JSON.parse(storage.getItem(key)||'null'):null;}catch{return null;}
  }
  function sync(storage,project,incoming){
    const c=checked(incoming),copy=C.clone(project),i=copy.classes.findIndex(k=>k.id===c.id),old=i<0?null:copy.classes[i];
    if(i<0)copy.classes.push(c);else copy.classes[i]=c;
    C.validateProject(C.clone(copy));C.validateArrowLayouts(copy);
    if(old&&signature(old)!==signature(c)){
      const key='talent-forge-class-backup-'+c.id+'-'+signature(old);
      const backup={schemaVersion:1,title:'Previous '+old.name+' class',backedUpAt:new Date().toISOString(),classes:[old]};
      if(!storage.getItem(key))storage.setItem(key,JSON.stringify(backup));
      const index=JSON.parse(storage.getItem(indexKey)||'{}');index[c.id]=key;storage.setItem(indexKey,JSON.stringify(index));
    }
    return copy;
  }
  const api={signature,stage,receive,sync,previous};global.TalentForgeWorkspace=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
