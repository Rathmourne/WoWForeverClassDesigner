const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const C=require('./src/core.js');
const root=__dirname,out=path.join(root,'site');
const project=C.validateProject(JSON.parse(fs.readFileSync(path.join(root,'project.json'),'utf8')));
C.validateArrowLayouts(project);
for(const c of project.classes)c.ranks={};
fs.mkdirSync(out,{recursive:true});
for(const name of ['index.html','designer.html','styles.css','core.js','builds.js','calculator.js','app.js','workspace.js','classic-artwork.js','library-tools.js','share.js','reference-data.js','forever-data.js','icon-catalog.js'])fs.copyFileSync(path.join(root,'src',name),path.join(out,name));
fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
const imageManifest={};
function indexImages(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())indexImages(file);
  else if(/\.(?:png|jpe?g|webp)$/i.test(file))imageManifest[crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]=path.relative(root,file).replaceAll('\\','/');
}}
indexImages(path.join(root,'assets'));
fs.writeFileSync(path.join(out,'asset-manifest.json'),JSON.stringify(imageManifest));
fs.writeFileSync(path.join(out,'project.json'),JSON.stringify(project));
fs.writeFileSync(path.join(out,'published-design.js'),'window.TALENT_FORGE_DEFAULT_PROJECT='+JSON.stringify(project).replace(/</g,'\\u003c')+';\n');
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log(`Built calculator with ${project.classes.length} classes in site/`);
