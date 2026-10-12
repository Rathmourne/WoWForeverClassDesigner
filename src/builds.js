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
    return new URLSearchParams({v:version(project),class:c.id,ranks:talents(c).map(t=>c.ranks[t.id]||0).join(',')}).toString();
  }
  function apply(project,hash){
    if(hash.length>4000)throw Error('This build link is too large.');
    const p=new URLSearchParams(hash.replace(/^#/,''));
    if(p.get('v')!==version(project))throw Error('This link belongs to another version of the class designs. Start a new build.');
    const c=project.classes.find(c=>c.id===p.get('class'));
    if(!c)throw Error('This build uses an unavailable class.');
    const raw=p.get('ranks')||'',list=raw.split(',');
    if(!/^\d{1,2}(,\d{1,2})*$/.test(raw)||list.length!==talents(c).length)throw Error('This build link has invalid ranks.');
    const ranks=Object.fromEntries(talents(c).map((t,i)=>[t.id,Number(list[i])]));
    restore(c,ranks);return c;
  }
  const api={version,restore,encode,apply,fingerprint,storageKey};global.TalentForgeBuild=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
