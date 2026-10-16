const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),W=require('../src/workspace.js');
const project=()=>JSON.parse(fs.readFileSync(path.join(__dirname,'../project.json'),'utf8'));
class Storage{
 constructor(){this.items=new Map();}get length(){return this.items.size;}key(i){return [...this.items.keys()][i]||null;}getItem(k){return this.items.get(k)||null;}setItem(k,v){this.items.set(k,String(v));}removeItem(k){this.items.delete(k);}
}
test('calculator to designer carries the complete current DH talents and abilities and preserves other classes',()=>{
 const s=new Storage(),p=project(),incoming=C.clone(p.classes.find(c=>c.sourceSlug==='demon-hunter'));
 const old=p.classes.find(c=>c.id===incoming.id);old.trees[0].talents.pop();old.abilities=old.abilities.slice(0,3);
 const others=C.clone(p.classes.filter(c=>c.id!==incoming.id)),before=C.clone(p);
 const token=W.stage(s,incoming),carried=W.receive(s,token),merged=W.sync(s,p,carried);
 assert.deepEqual(p,before);assert.deepEqual(merged.classes.filter(c=>c.id!==incoming.id),others);
 const result=merged.classes.find(c=>c.id===incoming.id);
 assert.deepEqual(result.trees,incoming.trees);assert.deepEqual(result.abilities,incoming.abilities);
 assert.equal(W.previous(s,incoming.id).classes[0].abilities.length,3);
});
test('designer to calculator to designer preserves unpublished ability rewrites and selected points',()=>{
 const s=new Storage(),p=project(),c=C.clone(p.classes.find(c=>c.sourceSlug==='demon-hunter'));
 c.abilities[0].description='My edited Chaos Strike';c.trees[0].talents[0].description='My new talent wording';
 c.ranks[c.trees[0].talents[0].id]=2;
 const preview=W.sync(s,p,W.receive(s,W.stage(s,c))),target=preview.classes.find(k=>k.id===c.id);
 assert.equal(target.abilities[0].description,'My edited Chaos Strike');assert.equal(C.total(target),2);
 const returned=W.sync(s,preview,W.receive(s,W.stage(s,target))).classes.find(k=>k.id===c.id);
 assert.deepEqual(returned,target);
});
test('mode switching supports a newly created class without replacing the published classes',()=>{
 const s=new Storage(),p=project(),c=C.clone(p.classes[0]);c.id='new-private-class';c.name='New class';c.sourceSlug='';
 for(const t of c.trees){t.id='new-'+t.id;for(const talent of t.talents){const old=talent.id;talent.id='new-'+old;if(talent.prerequisite)talent.prerequisite='new-'+talent.prerequisite;}}
 for(const a of c.abilities)a.id='new-'+a.id;c.ranks={};
 const result=W.sync(s,p,W.receive(s,W.stage(s,c)));assert.equal(result.classes.length,p.classes.length+1);assert.deepEqual(result.classes.slice(0,-1),p.classes);
});
test('backup storage failure stops replacement and malformed handoffs cannot alter the project',()=>{
 const s=new Storage(),p=project(),before=C.clone(p),c=C.clone(p.classes[0]);c.name='Changed class';
 s.setItem=()=>{throw Error('Storage full');};assert.throws(()=>W.sync(s,p,c),/Storage full/);assert.deepEqual(p,before);
 assert.throws(()=>W.receive(s,'../../invalid'),/invalid/);assert.throws(()=>W.receive(s,'00000000-0000-0000-0000-000000000000'),/no longer/);
});
test('repeated mode switches reuse the same class snapshot rather than filling browser storage',()=>{
 const s=new Storage(),c=project().classes.find(c=>c.sourceSlug==='demon-hunter'),first=W.stage(s,c);
 for(let i=0;i<20;i++)assert.equal(W.stage(s,c),first);
 assert.equal(s.length,1);
});
test('older saved workshops receive newly published classes while retaining private classes and current edits',()=>{
 const s=new Storage(),published=project(),necro=published.classes.find(c=>c.name==='Necromancer');assert.ok(necro);
 const saved=C.clone(published);saved.classes=saved.classes.filter(c=>c.id!==necro.id);
 const bard=C.clone(saved.classes[0]);bard.id='browser-only-bard';bard.name='Bard';bard.sourceSlug='';
 saved.classes.push(bard);saved.classes.find(c=>c.sourceSlug==='demon-hunter').abilities[0].description='My unpublished ability edit';
 const before=C.clone(saved),result=W.refreshPublished(s,saved,published);
 assert.deepEqual(saved,before);assert.deepEqual(result.updated,['Necromancer']);
 assert.deepEqual(result.project.classes.find(c=>c.id===necro.id),C.validateProject({schemaVersion:1,classes:[C.clone(necro)]}).classes[0]);
 assert.deepEqual(result.project.classes.filter(c=>c.id!==necro.id),before.classes);
 assert.deepEqual(W.refreshPublished(s,result.project,published).updated,[]);
});
test('published refresh backs up old versions and preserves a class currently carried between views',()=>{
 const s=new Storage(),published=project(),saved=C.clone(published),dh=saved.classes.find(c=>c.sourceSlug==='demon-hunter');
 dh.designVersion='older-version';dh.abilities[0].description='Old edited version';
 const protectedResult=W.refreshPublished(s,saved,published,{workingClassId:dh.id});
 assert.deepEqual(protectedResult.updated,[]);assert.equal(protectedResult.project.classes.find(c=>c.id===dh.id).abilities[0].description,'Old edited version');
 const updated=W.refreshPublished(s,saved,published);
 assert.ok(updated.updated.includes('Demon Hunter'));assert.equal(W.previous(s,dh.id).classes[0].abilities[0].description,'Old edited version');
});
