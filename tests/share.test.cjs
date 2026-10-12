const test = require('node:test');
const assert = require('node:assert/strict');
const Share = require('../src/share.js');
test('share links preserve Unicode class rewrites and rank allocations',async()=>{
  const project={title:'Frost — 氣',classes:[{name:'Monk',ranks:{talent:5},description:'Line 1\nLine 2 {value}'}]};
  const encoded=await Share.encode(project);
  assert.match(encoded,/^[A-Za-z0-9_-]+$/);
  assert.deepEqual(await Share.decode(encoded),project);
});
test('invalid and oversized share payloads are rejected',async()=>{
  await assert.rejects(()=>Share.decode('<script>'),/invalid/);
  await assert.rejects(()=>Share.encode({art:'x'.repeat(2*1024*1024)}),/too large/);
  const bomb=require('node:zlib').gzipSync(Buffer.from('x'.repeat(2*1024*1024+1))).toString('base64url');
  await assert.rejects(()=>Share.decode(bomb),/supported size/);
});
