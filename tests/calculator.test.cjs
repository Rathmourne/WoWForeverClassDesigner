const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../src/core.js'),B=require('../src/builds.js');
const root=path.join(__dirname,'..');
const fresh=()=>JSON.parse(fs.readFileSync(path.join(root,'project.json'),'utf8'));
test('All twelve published classes and their prerequisite routes validate',()=>{
  const p=fresh();assert.equal(p.classes.length,12);C.validateProject(p);C.validateArrowLayouts(p);
  assert.equal(p.classes.flatMap(c=>c.trees).length,36);
});
test('Each class shares and restores an independent build',()=>{
  for(const c of fresh().classes){const p=fresh(),target=p.classes.find(k=>k.id===c.id),tree=target.trees[0],t=tree.talents.find(t=>!C.unmet(target,tree,t));assert.ok(t);
    assert.ok(C.allocate(target,tree,t,1).ok);const hash=B.encode(p,target),copy=fresh();assert.equal(B.apply(copy,hash).ranks[t.id],1);
    assert.equal(C.total(copy.classes.find(k=>k.id===c.id)),1);assert.ok(hash.length<4000);
    for(const other of copy.classes.filter(k=>k.id!==c.id))assert.equal(C.total(other),0);
  }
});
test('Old design versions and malformed ranks do not overwrite a build',()=>{
  const p=fresh(),c=p.classes[0],hash=B.encode(p,c),before=JSON.stringify(c.ranks);
  assert.throws(()=>B.apply(p,hash.replace(/v=[^&]+/,'v=old')),/another version/);
  assert.throws(()=>B.apply(p,hash.replace(/ranks=.*/,'ranks=NaN')),/invalid ranks/);
  assert.equal(JSON.stringify(c.ranks),before);
});
test('Restored ranks respect caps, tier requirements, prerequisites and budget',()=>{
  const p=fresh();for(const c of p.classes){B.restore(c,Object.fromEntries(c.trees.flatMap(t=>t.talents).map(t=>[t.id,99])));assert.ok(C.total(c)<=c.pointBudget);
    for(const tree of c.trees)for(const t of tree.talents){assert.ok(c.ranks[t.id]<=t.maxRanks);if(c.ranks[t.id])assert.equal(C.unmet(c,tree,t),'');}}
});
test('Prerequisites require full ranks and prevent dependent refunds',()=>{
  const c=C.clone(fresh().classes[0]);c.ranks={};c.pointsPerTier=0;for(const tree of c.trees)for(const t of tree.talents)t.requiredPoints=0;
  const tree=c.trees.find(tree=>tree.talents.some(t=>t.prerequisite)),child=tree.talents.find(t=>t.prerequisite),parent=tree.talents.find(t=>t.id===child.prerequisite);
  assert.equal(C.allocate(c,tree,child,1).ok,false);
  for(let i=0;i<parent.maxRanks;i++)assert.ok(C.allocate(c,tree,parent,1).ok);
  assert.ok(C.allocate(c,tree,child,1).ok);assert.equal(C.allocate(c,tree,parent,-1).ok,false);
});
test('Main calculator retains player controls and links to the separate local-copy designer',()=>{
  const site=path.join(root,'site'),p=JSON.parse(fs.readFileSync(path.join(site,'project.json'),'utf8'));
  function check(v){if(typeof v==='string'&&v.startsWith('assets/'))assert.ok(fs.existsSync(path.join(site,v)),v);else if(v&&typeof v==='object')Object.values(v).forEach(check);}check(p);
  for(const c of p.classes)assert.equal(Object.keys(c.ranks).length,0);
  const html=fs.readFileSync(path.join(site,'index.html'),'utf8'),runtime=fs.readFileSync(path.join(site,'calculator.js'),'utf8');
  assert.doesNotMatch(html,/mode-design|import-project|class-settings|editor-dialog|app\.js/);
  assert.doesNotMatch(runtime,/item-edit|enter-design|add-talent|add-ability|readItemForm|editForm|renderLibrary/);
  for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!match[1].startsWith('https:')&&match[1]!=='./')assert.ok(fs.existsSync(path.join(site,match[1].split('?')[0])),match[1]);}
  assert.doesNotMatch(html,/\b(?:src|href)="\//);
  assert.ok(fs.existsSync(path.join(site,'.nojekyll')));
  assert.match(html,/href="designer.html"/);
  const designer=fs.readFileSync(path.join(site,'designer.html'),'utf8');
  assert.match(designer,/id="mode-design"/);assert.match(designer,/They do not change the published classes/);
  assert.doesNotMatch(fs.readFileSync(path.join(site,'styles.css'),'utf8'),/fonts\.googleapis/);
  for(const match of designer.matchAll(/src="([^"#]+)"/g))assert.ok(fs.existsSync(path.join(site,match[1].split('?')[0])));
  const defaults=fs.readFileSync(path.join(site,'published-design.js'),'utf8');
  assert.doesNotMatch(defaults,/exportedAt/);
});
