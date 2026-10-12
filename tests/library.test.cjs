const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const L=require('../src/library-tools.js');

test('Forever classes merge into an older workshop while preserving edited classes',()=>{
  const project={classes:[{id:'custom',name:'My warrior',sourceSlug:'warrior',description:'My rewrite'}]};
  const templates=[{id:'forever-warrior',name:'Warrior',sourceSlug:'warrior',description:'Reference'},{id:'forever-mage',name:'Mage',sourceSlug:'mage',abilities:[]}];
  assert.equal(L.mergeForeverClasses(project,templates),true);
  assert.equal(project.classes.length,2);assert.equal(project.classes[0].description,'My rewrite');
  project.classes[1].name='My mage';assert.equal(templates[1].name,'Mage');
  assert.equal(L.mergeForeverClasses(project,templates),false);assert.equal(project.classes.length,2);
});

test('older saved drafts receive matching spec artwork without changing authored data',()=>{
  const trees=['Blood','Frost','Unholy','Havoc','Vengeance','Felcraft','Brewmaster','Windwalker','Mistweaver'].map((name,i)=>({id:'tree-'+i,name,background:'assets/shaman-enhancement.png',talents:[{id:'talent-'+i,name:'Custom rewrite'}]}));
  const project={classes:[{name:'My class',ranks:{'talent-0':3},abilities:[{name:'My ability'}],trees}]};
  const before=JSON.stringify({ranks:project.classes[0].ranks,abilities:project.classes[0].abilities,talents:trees.map(t=>t.talents)});
  assert.equal(L.migrateStarterArtwork(project),true);
  assert.deepEqual(trees.map(t=>t.background),['blood','frost','unholy','havoc','vengeance','felcraft','martial-arts','zealot','devotion'].map(slug=>`assets/spec-backgrounds/${slug}.webp`));
  assert.equal(JSON.stringify({ranks:project.classes[0].ranks,abilities:project.classes[0].abilities,talents:trees.map(t=>t.talents)}),before);
  trees[0].background='assets/shaman-elemental-combat.png';
  assert.equal(L.migrateStarterArtwork(project),false);assert.equal(trees[0].background,'assets/shaman-elemental-combat.png');
});
test('artwork migration preserves uploaded backgrounds and unmatched custom trees',()=>{
  const project={classes:[{trees:[{name:'Blood',background:'data:image/png;base64,AAAA'},{name:'Custom discipline',background:'assets/shaman-restoration.png'}]}]};
  L.migrateStarterArtwork(project);
  assert.equal(project.classes[0].trees[0].background,'data:image/png;base64,AAAA');
  assert.equal(project.classes[0].trees[1].background,'assets/shaman-restoration.png');
});
test('renamed starter specs keep their names and receive artwork by class slot',()=>{
  const project={classes:[{sourceSlug:'demon-hunter',trees:[{name:'Havoc',background:'assets/shaman-enhancement.png'},{name:'Vengeance',background:'assets/shaman-restoration.png'},{name:'Devastation',background:'assets/shaman-elemental-combat.png'}]}]};
  L.migrateStarterArtwork(project);
  assert.equal(project.classes[0].trees[2].name,'Devastation');assert.equal(project.classes[0].trees[2].background,'assets/spec-backgrounds/felcraft.webp');
});
test('Demon Bite finds the real Demons Bite reference despite the apostrophe',()=>{
  assert.equal(L.matches("Demon's Bite",'Demon Bite'),true);
  assert.equal(L.matches("Demon's Bite 162243",'162243'),true);
  assert.equal(L.matches("Demon's Bite",'Death Grip'),false);
});
test('ability templates preserve source fields and edits do not modify the reference',()=>{
  const context={window:{}};require('node:vm').runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../src/reference-data.js'),'utf8'),context);
  const catalog=context.window.WOW_REFERENCE.find(c=>c.slug==='demon-hunter');
  const reference=catalog.entries.find(e=>e.id===162243);
  const before=JSON.stringify(reference),ability=L.abilityFromReference(reference,'custom-ability');
  assert.equal(ability.id,'custom-ability');assert.equal(ability.name,"Demon's Bite");
  assert.equal(ability.castTime,'Instant');assert.equal(ability.range,'Melee Range');assert.equal(ability.cost,'None');assert.equal(ability.school,'Physical');
  assert.match(ability.description,/Physical damage/);assert.match(ability.effects,/20 to 30 Fury/);assert.equal(ability.source.spellId,162243);
  ability.description='My classic rewrite';assert.equal(JSON.stringify(reference),before);
});
test('the icon search includes other classes, item icons, IDs, and spell aliases',()=>{
  const catalog={rows:[['ability_paladin_beaconoflight',53563,0,0],['inv_sword_04',135274,0,1],['inv_weapon_glave_01',131475,1,2]]};
  const entries=L.iconEntries(catalog,{inv_weapon_glave_01:["Demon's Bite"]});
  assert.equal(L.findIcons(entries,'paladin').length,1);assert.equal(L.findIcons(entries,'135274')[0].name,'inv_sword_04');
  assert.equal(L.findIcons(entries,'Demon Bite')[0].name,'inv_weapon_glave_01');
  assert.equal(L.findIcons(entries,'','Items & professions').length,2);assert.equal(L.sheetPath(entries[2]),'assets/icon-atlases/0001.webp');
});
test('the full downloaded catalog has unique names and every atlas file exists',()=>{
  const path=require('node:path'),root=path.join(__dirname,'..');
  const source=fs.readFileSync(path.join(root,'src/icon-catalog.js'),'utf8');
  const catalog=JSON.parse(source.slice('window.WOW_ICON_CATALOG='.length,source.lastIndexOf(';')));
  assert.equal(catalog.rows.length,catalog.count);assert.ok(catalog.rows.length>30000);
  assert.equal(new Set(catalog.rows.map(r=>r[0])).size,catalog.rows.length);
  // Wowhead has one genuine icon name ending in a bracket; names never become browser file paths.
  for(const row of catalog.rows){assert.match(row[0],/^[a-z0-9_\-\[\]]+$/);assert.ok(Number.isInteger(row[3])&&row[3]>=0&&row[3]<64);}
  for(let sheet=0;sheet<Math.ceil(catalog.count/64);sheet++)assert.ok(fs.existsSync(path.join(root,L.sheetPath({sheet}))));
});
