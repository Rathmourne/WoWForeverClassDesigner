(function(global){
  'use strict';
  const C=global.TalentForgeCore||require('./core.js');
  // Definition fingerprint prevents old rank positions being applied to rewritten trees.
  function fingerprint(text){
    let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
    return (hash>>>0).toString(36);
  }
  function version(project){return fingerprint(JSON.stringify(project.classes.map(c=>({...c,ranks:{}}))));}
  function storageKey(project,hash=''){const key='talent-forge-public-'+version(project);return hash?key+'-shared-'+fingerprint(hash.replace(/^#/,'')):key;}
  function talents(c){return c.trees.flatMap(t=>t.talents);}
  function restore(c,ranks){
    c.ranks={};if(ranks&&typeof ranks==='object'&&!Array.isArray(ranks))
      for(const t of talents(c))if(Number.isInteger(ranks[t.id]))c.ranks[t.id]=ranks[t.id];
    C.normalizeRanks(c);return c;
  }
  function encode(project,c){
    const compact=talents(c).map(t=>(c.ranks[t.id]||0).toString(36)).join('').replace(/0+$/,'')||'0';
    return new URLSearchParams({v:version(project),class:c.sourceSlug||c.id,b:compact}).toString();
  }
  function apply(project,hash){
    if(hash.length>4000)throw Error('This build link is too large.');
    const p=new URLSearchParams(hash.replace(/^#/,''));
    if(p.get('v')!==version(project))throw Error('This link belongs to another version of the class designs. Start a new build.');
    const c=project.classes.find(c=>c.id===p.get('class')||c.sourceSlug===p.get('class'));
    if(!c)throw Error('This build uses an unavailable class.');
    const raw=p.get('ranks')||'',compact=p.get('b');let list;
    if(compact!==null){
      if(!/^[0-9a]+$/.test(compact)||compact.length>talents(c).length)throw Error('This build link has invalid ranks.');
      list=Array.from({length:talents(c).length},(_,i)=>i<compact.length?parseInt(compact[i],36):0);
    }else{
      list=raw.split(',');
      if(!/^\d{1,2}(,\d{1,2})*$/.test(raw)||list.length!==talents(c).length)throw Error('This build link has invalid ranks.');
    }
    const ranks=Object.fromEntries(talents(c).map((t,i)=>[t.id,Number(list[i])]));
    restore(c,ranks);return c;
  }
  const api={version,restore,encode,apply,fingerprint,storageKey};global.TalentForgeBuild=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
