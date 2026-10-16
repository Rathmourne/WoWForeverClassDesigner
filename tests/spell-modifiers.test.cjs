const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../src/core.js'),L=require('../src/library-tools.js'),Share=require('../src/share.js');
test('Forever Lightning Bolt Rank 3 retains the verified damage coefficient',()=>{
  const p=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../project.json'),'utf8')),shaman=p.classes.find(c=>c.sourceSlug==='shaman'),bolt=shaman.abilities.find(a=>a.source.spellId===548);
  assert.equal(bolt.effectDetails[0].spellPower,0.714);assert.match(bolt.damageModifiers,/0\.714 \(71\.4%\)/);assert.match(bolt.effects,/Damage/);assert.equal(bolt.detailSourceUrl,'https://foreverdb.net/spell/548');assert.match(bolt.detailSourceVersion,/1\.60\.1\.70425/);assert.doesNotMatch(bolt.damageModifiers,/0\.554/);
});
test('Modifier edits and unknown source values survive project validation and sharing',async()=>{
  const p=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../project.json'),'utf8')),c=p.classes[0];
  c.abilities[0].damageModifiers='My rewrite: 75% of Spell Power';
  const snapshot=Share.snapshot(C.validateProject(p),c.id,'current',true),decoded=await Share.decode(await Share.encode(snapshot));assert.equal(decoded.classes[0].abilities[0].damageModifiers,'My rewrite: 75% of Spell Power');
  c.abilities[0].damageModifiers={invalid:true};assert.throws(()=>C.validateProject(p),/damage modifiers/);
});
test('A database ability template copies modifiers independently and missing fields stay blank',()=>{
  const source={id:548,name:'Lightning Bolt',minLevel:14,description:'Damage',damageModifiers:'0.714 Spell Power',effects:'School Damage',effectDetails:[{index:1,spellPower:0.714}]};
  const a=L.abilityFromReference(source,'a');assert.equal(a.damageModifiers,source.damageModifiers);a.effectDetails[0].spellPower=1;assert.equal(source.effectDetails[0].spellPower,0.714);
  assert.equal(L.abilityFromReference({id:999,name:'Unknown'},'b').damageModifiers,'');
});
test('All imported Forever spell references have client effect data with source provenance',()=>{
  const context={window:{}};for(const file of ['reference-data.js','forever-data.js'])vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../src',file),'utf8'),context);
  const entries=context.window.WOW_REFERENCE.flatMap(c=>c.entries).filter(e=>e.sourceUrl.includes('/forever/'));
  assert.ok(entries.length>1500);
  for(const e of entries){assert.equal(e.detailStatus,'available',e.id);assert.ok(Array.isArray(e.effectDetails));assert.ok(typeof e.damageModifiers==='string'&&e.damageModifiers.length>0);assert.match(e.detailSourceUrl,/^https:\/\/foreverdb\.net\/spell\/\d+$/);}
});
test('Upgrading existing drafts fills missing source details without replacing authored modifiers',()=>{
  const p={classes:[{abilities:[{id:'a',description:'My rewritten spell',effects:'My effect',damageModifiers:'My 90% scaling',spellDetailVersion:1,source:{spellId:548,url:'https://www.wowhead.com/forever/spell=548'}}],trees:[]}]};
  const refs=[{entries:[{id:548,sourceUrl:'https://www.wowhead.com/forever/spell=548',damageModifiers:'0.714',effects:'Damage',detailStatus:'available',detailSourceUrl:'https://foreverdb.net/spell/548'}]}];
  assert.equal(L.hydrateSpellDetails(p,refs),true);assert.equal(p.classes[0].abilities[0].damageModifiers,'My 90% scaling');assert.equal(p.classes[0].abilities[0].effects,'My effect');assert.equal(p.classes[0].abilities[0].description,'My rewritten spell');assert.equal(L.hydrateSpellDetails(p,refs),false);
});
