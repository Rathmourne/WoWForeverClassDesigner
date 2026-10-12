const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');
function talent(id, row, maxRanks=5, prerequisite='', col=0) {
  return {id,name:id,icon:'assets/wowhead/inv_misc_questionmark.jpg',description:'Increases damage by {value}% at rank {rank}.',rankDescriptions:[],valuePerRank:2,row,col,maxRanks,requiredPoints:null,prerequisite,type:'Passive',school:'Physical'};
}
function fixture() {
  return {id:'class',name:'Test',description:'Draft',color:'#abcdef',icon:'assets/wowhead/class_monk.jpg',pointBudget:51,pointsPerTier:5,startLevel:10,levelCap:60,ranks:{},abilities:[],trees:[
    {id:'t1',name:'First',icon:'assets/wowhead/class_monk.jpg',background:'assets/shaman-restoration.png',talents:[talent('a',0),talent('b',1,5,'a'),talent('c',2,1,'b')]},
    {id:'t2',name:'Second',icon:'assets/wowhead/class_monk.jpg',background:'assets/shaman-restoration.png',talents:[talent('d',0)]},
    {id:'t3',name:'Third',icon:'assets/wowhead/class_monk.jpg',background:'assets/shaman-restoration.png',talents:[]}]};
}
test('classic tier requirements use earlier points in the same tree',()=>{
  const c=fixture(),tree=c.trees[0];c.ranks.d=5;
  assert.equal(C.allocate(c,tree,tree.talents[1],1).ok,false);
  c.ranks.a=5;assert.equal(C.allocate(c,tree,tree.talents[1],1).ok,true);
});
test('shared point budget and rank caps are enforced',()=>{
  const c=fixture(),tree=c.trees[0];c.pointBudget=1;
  assert.equal(C.allocate(c,tree,tree.talents[0],1).ok,true);
  assert.equal(C.allocate(c,tree,tree.talents[0],1).ok,false);
  c.pointBudget=51;c.ranks.a=5;assert.equal(C.allocate(c,tree,tree.talents[0],1).ok,false);
});
test('refunds cannot break dependent ranks',()=>{
  const c=fixture(),tree=c.trees[0];c.ranks={a:5,b:5,c:1};
  assert.equal(C.allocate(c,tree,tree.talents[0],-1).ok,false);
  assert.equal(C.allocate(c,tree,tree.talents[1],-1).ok,false);
  assert.equal(C.allocate(c,tree,tree.talents[2],-1).ok,true);
  assert.equal(C.allocate(c,tree,tree.talents[1],-1).ok,true);
});
test('rule edits refund invalid ranks and remove deleted talent allocations',()=>{
  const c=fixture();c.ranks={a:5,b:5,c:1,deleted:5};c.trees[0].talents[0].maxRanks=3;
  C.normalizeRanks(c);assert.deepEqual(c.ranks,{a:3,b:0,c:0,d:0});
});
test('budget reductions prune highest tiers before lower ranks',()=>{
  const c=fixture();c.ranks={a:5,b:5,c:1};c.pointBudget=5;C.normalizeRanks(c);
  assert.equal(C.total(c),5);assert.equal(c.ranks.a,5);assert.equal(c.ranks.b,0);assert.equal(c.ranks.c,0);
});
test('import/export round trip preserves definitions and valid builds',()=>{
  const c=fixture();c.ranks={a:5,b:5,c:1};C.normalizeRanks(c);const p={schemaVersion:1,classes:[c]};
  assert.deepEqual(C.validateProject(JSON.parse(JSON.stringify(p))),p);
});
test('invalid imports cannot create cycles or overlapping grid slots',()=>{
  const c=fixture();c.trees[0].talents[0].prerequisite='c';
  assert.throws(()=>C.validateProject({schemaVersion:1,classes:[c]}),/earlier tier/);
  c.trees[0].talents[0].prerequisite='';c.trees[0].talents.push(talent('overlap',0));
  assert.throws(()=>C.validateProject({schemaVersion:1,classes:[c]}),/same slot/);
});
test('only local or safely uploaded image assets are accepted',()=>{
  assert.equal(C.safeImage('assets/../../secret'),false);
  assert.equal(C.safeImage('javascript:alert(1)'),false);
  assert.equal(C.safeImage('data:image/svg+xml;base64,PHN2Zz4='),false);
  assert.equal(C.safeImage('assets/wowhead/class_monk.jpg'),true);
});
test('same-tier Forever prerequisites allocate and draw horizontally without crossing unrelated slots',()=>{
  const c=fixture(),tree=c.trees[0],parent=talent('parent',0,1,'',1),child=talent('child',0,1,'parent',0);
  tree.talents=[child,parent];C.validateProject({schemaVersion:1,classes:[c]});
  assert.equal(C.allocate(c,tree,child,1).ok,false);assert.equal(C.allocate(c,tree,parent,1).ok,true);assert.equal(C.allocate(c,tree,child,1).ok,true);
  assert.equal(C.classicConnection(tree,child).kind,'horizontal');assert.equal(C.allocate(c,tree,parent,-1).ok,false);
  parent.maxRanks=2;C.normalizeRanks(c);assert.equal(c.ranks.child,0);
  parent.prerequisite='child';assert.throws(()=>C.validateProject({schemaVersion:1,classes:[c]}),/cycles/);
  parent.prerequisite='';parent.col=2;tree.talents.push(talent('blocker',0,1,'',1));assert.equal(C.classicConnection(tree,child),null);
});
test('rank templates and explicit per-rank descriptions render correctly',()=>{
  const t=talent('ranked',0);assert.equal(C.description(t,3),'Increases damage by 6% at rank 3.');
  t.rankDescriptions=['First','Second'];assert.equal(C.description(t,2),'Second');
});
test('a fully ranked actual source is required even with enough earlier tier points',()=>{
  const c=fixture(),tree=c.trees[0];c.ranks={a:5,b:4};
  c.pointsPerTier=0;
  assert.equal(C.allocate(c,tree,tree.talents[2],1).ok,false);
  assert.equal(C.allocate(c,tree,tree.talents[1],1).ok,true);
  assert.equal(C.allocate(c,tree,tree.talents[2],1).ok,true);
});
test('arrow controls do not change prerequisites and survive project export',()=>{
  const c=fixture(),t=c.trees[0].talents[2];
  t.arrow={route:'left',startEdge:'bottom',endEdge:'top',offset:-12,bend:0};
  const restored=C.validateProject({schemaVersion:1,classes:[c]}).classes[0].trees[0].talents[2];
  assert.deepEqual(restored.arrow,t.arrow);assert.equal(restored.prerequisite,'b');
  t.arrow.offset=300;assert.throws(()=>C.validateProject({schemaVersion:1,classes:[c]}),/arrow offsets/);
});
test('arrow anchors stop outside the icons and side routing stays in the canvas',()=>{
  const source={left:130,right:170,top:20,bottom:60},target={left:130,right:170,top:160,bottom:200};
  assert.equal(C.arrowPath(source,target),'M 150 62 V 158');
  const left=C.arrowPath(source,target,{route:'left'});
  assert.equal(left,'M 128 40 L 118 40 H 110 V 180 H 118 L 128 180');
  assert.notEqual(C.arrowPath(source,target,{route:'left',offset:-12}),left);
});
test('classic arrows cannot cross occupied slots and prefer a clear elbow',()=>{
  const source=talent('source',0,5,'',1),child=talent('child',2,1,'source',1),blocker=talent('blocker',1,5,'',1);
  const tree={talents:[source,child,blocker]};
  assert.equal(C.classicConnection(tree,child,'direct'),null);
  const safe=C.classicConnection(tree,child);assert.equal(safe.kind,'lane');assert.equal(safe.points[1][0],.5);
  tree.talents.push(talent('left',0,5,'',0),talent('right',0,5,'',2));
  assert.equal(C.classicConnection(tree,child),null);
  child.col=3;tree.talents=tree.talents.filter(t=>t.id!=='right');
  assert.equal(C.classicConnection(tree,child).kind,'elbow');
});
test('adding a talent to an arrow path is rejected by layout validation',()=>{
  const c=fixture();c.trees[0].talents[2].prerequisite='a';
  c.trees[0].talents[2].arrow={route:'direct',offset:0,startEdge:'auto',endEdge:'auto',bend:0};
  assert.throws(()=>C.validateArrowLayouts({classes:[c]}),/occupied talent slot/);
});
