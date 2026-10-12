(function(global){
  'use strict';
  const normalise=value=>String(value||'').toLowerCase().normalize('NFKD').replace(/['’]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const matches=(text,query)=>normalise(query).split(/\s+/).filter(Boolean).every(token=>normalise(text).includes(token));
  function category(name){
    if(/^ability_|^talents?_|^petability_/.test(name))return 'Abilities';
    if(/^spell_/.test(name))return 'Spells';
    if(/^inv_|^item_|^trade_|^profession_/.test(name))return 'Items & professions';
    if(/^achievement_|^achievment_/.test(name))return 'Achievements';
    if(/^class|^race|^racial/.test(name))return 'Classes & races';
    return 'Other';
  }
  function iconEntries(catalog,aliases={}){
    return catalog.rows.map(([name,id,sheet,slot])=>({name,id,sheet,slot,category:category(name),search:normalise(name+' '+id+' '+(aliases[name]||[]).join(' '))}));
  }
  function findIcons(entries,query='',group='All icons'){
    const tokens=normalise(query).split(/\s+/).filter(Boolean);
    return entries.filter(e=>(group==='All icons'||e.category===group)&&tokens.every(t=>e.search.includes(t)));
  }
  function sheetPath(entry){return 'assets/icon-atlases/'+String(entry.sheet).padStart(4,'0')+'.webp';}
  function abilityFromReference(reference,id){
    const bite=reference.id===162243||reference.id===344859;
    return {id,name:reference.name,icon:reference.icon,description:reference.description||'',type:reference.passive?'Passive':'Active',
      level:Math.min(100,Math.max(1,reference.minLevel||10)),cost:reference.cost||'None',castTime:reference.castTime||'Instant',
      cooldown:reference.cooldown||'None',range:reference.range||'Self',school:reference.school||(bite?'Physical':'Unspecified'),
      effects:reference.effects||(bite?'Deals (105.05% of Attack Power) Physical damage\nGenerates 20 to 30 Fury':''),damageModifiers:reference.damageModifiers||'',effectDetails:JSON.parse(JSON.stringify(reference.effectDetails||[])),detailStatus:reference.detailStatus||'',detailSourceUrl:reference.detailSourceUrl||'',detailSourceVersion:reference.detailSourceVersion||'',
      source:{spellId:reference.id,url:reference.sourceUrl,version:reference.gameVersion||'Retail 12.1.0 / Midnight'},sourceMissingDescription:!!reference.sourceMissingDescription};
  }
  function migrateStarterArtwork(project){
    const legacy=new Set(['assets/shaman-elemental-combat.png','assets/shaman-enhancement.png','assets/shaman-restoration.png']);
    const specs=new Map([
      ['blood','blood'],['frost','frost'],['unholy','unholy'],['havoc','havoc'],['vengeance','vengeance'],['felcraft','felcraft'],
      ['brewmaster','martial-arts'],['martial arts','martial-arts'],['windwalker','zealot'],['zealot','zealot'],['mistweaver','devotion'],['devotion','devotion']
    ]);
    const classSpecs={'death-knight':['blood','frost','unholy'],'demon-hunter':['havoc','vengeance','felcraft'],monk:['martial-arts','zealot','devotion']};
    let changed=false;
    for(const c of project.classes)for(const [index,tree] of c.trees.entries()){
      const slug=specs.get(tree.name.trim().toLowerCase())||classSpecs[c.sourceSlug]?.[index];
      if(!slug||tree.specArtworkVersion===1)continue;
      if(legacy.has(tree.background))tree.background=`assets/spec-backgrounds/${slug}.webp`;
      // Only upgrade once: deliberately choosing original scenery later must stick.
      tree.specArtworkVersion=1;changed=true;
    }
    return changed;
  }
  function mergeForeverClasses(project,templates){
    if(project.foreverCatalogVersion===1||!templates.length)return false;
    for(const template of templates){
      if(!project.classes.some(c=>c.id===template.id||c.sourceSlug===template.sourceSlug||c.name.toLowerCase()===template.name.toLowerCase()))project.classes.push(JSON.parse(JSON.stringify(template)));
    }
    project.foreverCatalogVersion=1;return true;
  }
  function hydrateSpellDetails(project,references){
    const key=(id,url)=>(String(url||'').includes('/forever/')?'forever':'retail')+'-'+id;
    const entries=new Map(references.flatMap(c=>c.entries.map(e=>[key(e.id,e.sourceUrl),e])));
    let changed=false;
    for(const c of project.classes)for(const item of [...c.abilities,...c.trees.flatMap(t=>t.talents)]){
      if(item.spellDetailVersion===2||!item.source?.spellId)continue;
      const ref=entries.get(key(item.source.spellId,item.source.url));if(!ref)continue;
      const upgrading=item.spellDetailVersion===1;
      if(!Object.hasOwn(item,'damageModifiers')||upgrading&&!item.damageModifiers)item.damageModifiers=ref.damageModifiers||'';
      if(!item.effects&&ref.effects)item.effects=ref.effects;
      if(!item.effectDetails||upgrading)item.effectDetails=JSON.parse(JSON.stringify(ref.effectDetails||[]));
      if(!item.detailStatus||upgrading)item.detailStatus=ref.detailStatus||'';
      if(!item.detailSourceUrl||upgrading)item.detailSourceUrl=ref.detailSourceUrl||'';
      if(!item.detailSourceVersion||upgrading)item.detailSourceVersion=ref.detailSourceVersion||'';
      item.spellDetailVersion=2;changed=true;
    }
    return changed;
  }
  const api={normalise,matches,category,iconEntries,findIcons,sheetPath,abilityFromReference,migrateStarterArtwork,mergeForeverClasses,hydrateSpellDetails};
  global.TalentForgeLibrary=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
