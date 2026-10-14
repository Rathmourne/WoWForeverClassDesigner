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
