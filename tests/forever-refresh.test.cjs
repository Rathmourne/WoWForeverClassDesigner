const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),raw=JSON.parse(fs.readFileSync(path.join(root,'assets/data/wowhead-forever-20261015.json'),'utf8'));
const box={window:{WOW_REFERENCE:[]}};vm.runInNewContext(fs.readFileSync(path.join(root,'src/forever-data.js'),'utf8'),box);
const classes=box.window.WOW_FOREVER_CLASSES,refs=box.window.WOW_REFERENCE;
test('all nine original class templates match the refreshed Wowhead tree layout, ranks and prerequisites',()=>{
 assert.equal(classes.length,9);assert.equal(classes.reduce((n,c)=>n+c.trees.length,0),27);
 assert.equal(classes.reduce((n,c)=>n+c.trees.reduce((m,t)=>m+t.talents.length,0),0),466);
 for(const c of classes)for(const tree of c.trees){
  const source=raw.talents[tree.sourceTreeId];assert.equal(tree.talents.length,Object.keys(source).length,c.name+' '+tree.name);
  for(const talent of tree.talents){const node=source[talent.source.talentId];assert.ok(node,talent.name);
   assert.equal(talent.name,node.name);assert.equal(talent.row,node.row);assert.equal(talent.col,node.col);assert.equal(talent.maxRanks,node.ranks.length);
   assert.deepEqual(Array.from(talent.source.rankSpellIds),node.ranks);assert.equal(talent.rankDescriptions.length,node.ranks.length);
   assert.equal(talent.requiredPoints,node.requiredPoints);assert.equal(talent.prerequisite,node.requires.length?'forever-talent-'+node.requires[0].id:'');
  }
 }
});
test('all 1521 trained ability ranks retain calculator spell IDs and learned levels with current client details',()=>{
 assert.equal(classes.reduce((n,c)=>n+c.abilities.length,0),1521);
 for(const catalog of refs){const c=classes.find(c=>c.sourceSlug===catalog.slug),source=raw.abilities[catalog.classId],ids=new Map(source.map(a=>[a.id,a]));
  assert.equal(c.abilities.length,source.length);
  for(const a of c.abilities){assert.ok(ids.has(a.source.spellId));assert.equal(a.level,ids.get(a.source.spellId).level);assert.equal(a.detailStatus,'available');assert.match(a.detailSourceVersion,/1\.60\.1\.70425/);}
 }
 const names=classes.flatMap(c=>c.trees.flatMap(t=>t.talents.map(t=>t.name)));
 assert.ok(names.includes('Arcane Wrath'));assert.ok(names.includes('Dark Inspiration'));
});
