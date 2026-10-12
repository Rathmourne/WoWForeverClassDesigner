const test=require('node:test'),assert=require('node:assert/strict');
const Share=require('../src/share.js'),B=require('../src/builds.js');
test('Shared design snapshots preserve the author draft and optionally include points',()=>{
  const p={schemaVersion:1,exportedAt:'private export timestamp',classes:[{id:'a',name:'My rewrite',ranks:{x:3}},{id:'b',name:'Other class',ranks:{y:2}}]};
  const before=JSON.stringify(p),empty=Share.snapshot(p,'a'),withPoints=Share.snapshot(p,'a','current',true);
  assert.equal(empty.classes.length,1);assert.deepEqual(empty.classes[0].ranks,{});assert.equal(withPoints.classes[0].ranks.x,3);assert.equal(withPoints.exportedAt,undefined);
  withPoints.classes[0].name='Recipient preview';assert.equal(JSON.stringify(p),before);
});
test('Every shared design uses storage separate from the recipient draft',()=>{
  const draft=Share.storageKey(false),first=Share.storageKey(true,'first'),second=Share.storageKey(true,'second');
  assert.notEqual(first,draft);assert.notEqual(second,draft);assert.notEqual(first,second);
  const storage=new Map([[draft,'My existing creation']]);storage.set(first,'Received design points');assert.equal(storage.get(draft),'My existing creation');
});
test('Published shared rank builds cannot overwrite normal personal builds',()=>{
  const p={classes:[{id:'c',ranks:{x:1}}]},own=B.storageKey(p),shared=B.storageKey(p,'#v=one&class=c&ranks=2');
  assert.notEqual(own,shared);assert.equal(shared,B.storageKey(p,'v=one&class=c&ranks=2'));
  const storage=new Map([[own,'Original points']]);storage.set(shared,'New points');assert.equal(storage.get(own),'Original points');
});
