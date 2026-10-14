const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const Share=require('../src/share.js'),C=require('../src/core.js'),Build=require('../src/builds.js');
const project=JSON.parse(fs.readFileSync(path.join(__dirname,'../site/project.json'),'utf8'));
const assets=JSON.parse(fs.readFileSync(path.join(__dirname,'../site/asset-manifest.json'),'utf8'));
const dh=project.classes.find(c=>c.sourceSlug==='demon-hunter');
function inlineCopy(){const copy=C.clone(dh);function visit(item){for(const [key,v] of Object.entries(item)){
 if(key==='icon'&&typeof v==='string'&&v.startsWith('assets/shared/'))item[key]='data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'..',v)).toString('base64');
 else if(v&&typeof v==='object')visit(v);
}}visit(copy);return{...project,classes:[copy]};}

test('embedded published icons become hosted references without mutating the local draft',async()=>{
 const input=inlineCopy(),before=JSON.stringify(input),copy=await Share.compact(input,assets);
 assert.equal(JSON.stringify(input),before);assert.deepEqual(copy.classes[0],dh);
 assert.ok(JSON.stringify(copy).length<JSON.stringify(input).length/3);
 const unknown={classes:[{icon:'data:image/png;base64,eA=='}]};assert.deepEqual(await Share.compact(unknown,assets),unknown);
});

test('published class links stay under 200 characters and preserve exact allocated ranks in isolated storage',async()=>{
 const input=inlineCopy(),first=input.classes[0].trees[0].talents[0];input.classes[0].ranks[first.id]=first.maxRanks;
 const link=await Share.publishedLink(input,dh.id,true,project,assets);
 assert.ok(link.length>0&&link.length<200,link.length);
 assert.equal(new URL(link).searchParams.get('share'),'2');
 const restored=C.clone(project),result=Build.apply(restored,new URL(link).hash);
 assert.equal(result.ranks[first.id],first.maxRanks);
 assert.notEqual(Build.storageKey(project),Build.storageKey(project,new URL(link).hash));
 const blank=await Share.publishedLink(input,dh.id,false,project,assets);
 assert.equal(C.total(Build.apply(C.clone(project),new URL(blank).hash)),0);
});

test('changed class designs use a compressed snapshot and retain custom wording, prerequisites and coefficients',async()=>{
 const input=inlineCopy();input.classes[0].trees[0].talents[0].description='My new Fury rewrite — 氣';
 assert.equal(await Share.publishedLink(input,dh.id,true,project,assets),'');
 const encoded=await Share.encode(input,{assets});
 // Uploaded artwork can legitimately make a snapshot larger than a link-size target.
 // Verify the gzip transport itself and that every authored field survives it.
 assert.equal(JSON.parse(zlib.gunzipSync(Buffer.from(encoded,'base64url'))).shareFormat,2);
 assert.deepEqual(await Share.decode(encoded),await Share.compact(input,assets));
});

test('unknown custom images are bundled once and invalid dictionary references are rejected',async()=>{
 const image='data:image/png;base64,'+crypto.randomBytes(12000).toString('base64');
 const input={classes:[{icon:image,trees:Array.from({length:12},()=>({icon:image}))}]};
 const encoded=await Share.encode(input,{assets:{}});
 assert.ok(encoded.length<30000,encoded.length);assert.deepEqual(await Share.decode(encoded),input);
 const invalid=zlib.gzipSync(JSON.stringify({shareFormat:2,images:[image],project:{icon:{$image:2}}})).toString('base64url');
 await assert.rejects(()=>Share.decode(invalid),/invalid image reference/);
});

test('legacy compressed project links continue to decode',async()=>{
 const old={title:'Existing shared class',classes:[{name:'Old draft',ranks:{x:2}}]};
 const encoded=zlib.gzipSync(JSON.stringify(old)).toString('base64url');assert.deepEqual(await Share.decode(encoded),old);
});
