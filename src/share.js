(function (global) {
  'use strict';
  const maxBytes = 2 * 1024 * 1024;
  let manifestPromise,baselinePromise;
  const localHost=()=>/^(?:localhost|127\.0\.0\.1|\[::1\])$/.test(global.location?.hostname||'');
  function siteUrl(file='designer.html') {
    return new URL(file,localHost()?'https://rathmourne.github.io/WoWForeverClassDesigner/':global.location?.href||'https://rathmourne.github.io/WoWForeverClassDesigner/').href;
  }
  async function manifest() {
    if(!global.location||global.location.protocol==='file:')return {};
    return manifestPromise||(manifestPromise=fetch('asset-manifest.json',{cache:'no-cache'}).then(r=>r.ok?r.json():{}).catch(()=>({})));
  }
  async function compact(project,assets) {
    const copy=JSON.parse(JSON.stringify(project)),cache=new Map();
    assets=assets||await manifest();
    async function image(value){
      if(!/^data:image\/(?:png|jpeg|webp);base64,/.test(value))return value;
      if(!cache.has(value))cache.set(value,(async()=>{
        const bytes=Uint8Array.from(atob(value.slice(value.indexOf(',')+1)),c=>c.charCodeAt(0));
        const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
        const asset=assets[hash];
        return typeof asset==='string'&&/^assets\/[\w./-]+$/.test(asset)&&!asset.includes('..')?asset:value;
      })());
      return cache.get(value);
    }
    async function visit(item){await Promise.all(Object.keys(item).map(async key=>{
      const value=item[key];
      if(['icon','background'].includes(key)&&typeof value==='string')item[key]=await image(value);
      else if(value&&typeof value==='object')await visit(value);
    }));}
    await visit(copy);return copy;
  }
  function pack(project){
    const copy=JSON.parse(JSON.stringify(project)),images=[],indices=new Map();
    function visit(item){for(const [key,value] of Object.entries(item)){
      if(['icon','background'].includes(key)&&typeof value==='string'&&value.startsWith('data:image/')){
        if(!indices.has(value)){indices.set(value,images.length);images.push(value);}
        item[key]={$image:indices.get(value)};
      }else if(value&&typeof value==='object')visit(value);
    }}
    visit(copy);return images.length?{shareFormat:2,images,project:copy}:copy;
  }
  function unpack(data){
    if(data.shareFormat!==2)return data;
    if(!Array.isArray(data.images)||data.images.length>5000||!data.project||typeof data.project!=='object')throw Error('This calculator link is invalid.');
    let expandedSize=0;
    function visit(item){for(const [key,value] of Object.entries(item)){
      if(['icon','background'].includes(key)&&value&&typeof value==='object'&&Object.hasOwn(value,'$image')){
        const index=value.$image,image=data.images[index];
        if(!Number.isInteger(index)||index<0||typeof image!=='string'||!/^data:image\/(?:png|jpeg|webp);base64,/.test(image))throw Error('This calculator link has an invalid image reference.');
        expandedSize+=image.length;
        if(expandedSize>maxBytes)throw Error('This calculator link exceeds the supported size.');
        item[key]=image;
      }else if(value&&typeof value==='object')visit(value);
    }}
    visit(data.project);
    if(new TextEncoder().encode(JSON.stringify(data.project)).length>maxBytes)throw Error('This calculator link exceeds the supported size.');
    return data.project;
  }
  function comparable(c){
    const copy=JSON.parse(JSON.stringify(c));delete copy.ranks;
    return JSON.stringify(copy,(_,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.keys(value).sort().map(k=>[k,value[k]])):value);
  }
  async function publishedLink(project,classId,includeRanks=false,baseline,assets){
    if(!baseline){
      if(!global.location||global.location.protocol==='file:')return '';
      baseline=await (baselinePromise||(baselinePromise=fetch(localHost()?'share-baseline.json':'project.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null)));
    }
    if(!baseline)return '';
    const compacted=await compact(project,assets),c=compacted.classes.find(c=>c.id===classId),published=baseline.classes.find(k=>k.id===classId);
    if(!c||!published)return '';
    const normalize=record=>global.TalentForgeCore?global.TalentForgeCore.validateProject({schemaVersion:1,classes:[JSON.parse(JSON.stringify(record))]}).classes[0]:record;
    if(comparable(normalize(c))!==comparable(normalize(published)))return '';
    const version=fingerprint(JSON.stringify(baseline.classes.map(c=>({...c,ranks:{}}))));
    const ranks=published.trees.flatMap(t=>t.talents.map(t=>includeRanks?c.ranks[t.id]||0:0));
    const url=new URL(siteUrl('./'));url.search='?class='+encodeURIComponent(published.sourceSlug||published.id)+'&share=2';
    url.hash=new URLSearchParams({v:version,class:published.sourceSlug||published.id,b:ranks.map(n=>n.toString(36)).join('').replace(/0+$/,'')||'0'}).toString();
    return url.href;
  }
  async function encode(project,options={}) {
    const copy=await compact(project,options.assets);
    if(new TextEncoder().encode(JSON.stringify(copy)).length>maxBytes)throw new Error('This design is too large for a link. Download the calculator file instead.');
    const raw = new TextEncoder().encode(JSON.stringify(pack(copy)));
    if (raw.length > maxBytes) throw new Error('This design is too large for a link. Download the calculator file instead.');
    const bytes = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
    if (bytes.length > 48000) throw new Error('The selected classes are too large for a link. Download the calculator file instead.');
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async function decode(encoded) {
    if (!/^[A-Za-z0-9_-]{1,64000}$/.test(encoded)) throw new Error('This calculator link is invalid.');
    const bytes = Uint8Array.from(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
    const chunks = []; let size = 0;
    try {
      while (true) {
        const result = await reader.read(); if (result.done) break;
        size += result.value.length;
        if (size > maxBytes) throw new Error('This calculator link exceeds the supported size.');
        chunks.push(result.value);
      }
    } finally { await reader.cancel(); }
    return unpack(JSON.parse(await new Blob(chunks).text()));
  }
  function fingerprint(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return (hash >>> 0).toString(36);
  }
  function storageKey(playMode,payload='',embedded) {
    return playMode?'talent-forge-shared-build-'+fingerprint(payload||JSON.stringify(embedded)||'starter'):'talent-forge-public-draft-v1';
  }
  function snapshot(project,classId,scope='current',includeRanks=false) {
    const copy=JSON.parse(JSON.stringify(project));delete copy.exportedAt;
    if(scope==='current')copy.classes=copy.classes.filter(c=>c.id===classId);
    if(!includeRanks)for(const c of copy.classes)c.ranks={};
    return copy;
  }
  async function standalone(project) {
    const copy = JSON.parse(JSON.stringify(project)), images = new Map();
    function image(path) {
      if (path.startsWith('data:')) return Promise.resolve(path);
      if (!images.has(path)) images.set(path, (async () => {
        const response = await fetch(path); if (!response.ok) throw new Error('Could not bundle artwork: ' + path);
        const blob = await response.blob();
        return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
      })());
      return images.get(path);
    }
    const tasks = [];
    const replace = (object, key) => {
      const path=object[key];
      const asset=key==='background'&&global.ClassicArtwork?.supports(path)
        ? global.ClassicArtwork.texture(path+'?v=20261012-classic1').then(value=>value||image(path))
        : image(path);
      tasks.push(asset.then(value => { object[key] = value; }));
    };
    for (const c of copy.classes) {
      replace(c, 'icon');
      for (const tree of c.trees) { replace(tree, 'icon'); replace(tree, 'background'); for (const t of tree.talents) replace(t, 'icon'); }
      for (const a of c.abilities) replace(a, 'icon');
    }
    await Promise.all(tasks);
    const files = await Promise.all(['designer.html', 'styles.css', 'core.js', 'library-tools.js', 'share.js', 'app.js', 'classic-artwork.js'].map(async path => {
      const response = await fetch(path,{cache:'no-store'}); if (!response.ok) throw new Error('Could not bundle calculator files.'); return response.text();
    }));
    const [html, css, core, library, sharing, app, artwork] = files;
    const safeScript = value => value.replace(/<\/script/gi, '<\\/script');
    const data = JSON.stringify(copy).replace(/</g, '\\u003c');
    return html.replace(/<link rel="stylesheet" href="styles\.css(?:\?[^"]*)?">/, () => '<style>' + css.replace(/<\/style/gi, '<\\/style') + '</style>')
      .replace('<script src="reference-data.js"></script>', () => '<script>window.WOW_REFERENCE=[];window.TALENT_FORGE_SHARED_PROJECT=' + data + ';</script>')
      .replace('<script src="published-design.js"></script>', '')
      .replace(/<script src="forever-data\.js(?:\?[^"]*)?"><\/script>/, '')
      .replace(/<script src="core\.js(?:\?[^"]*)?"><\/script>/, () => '<script>' + safeScript(core) + '</script>')
      .replace(/<script src="library-tools\.js(?:\?[^"]*)?"><\/script>/, () => '<script>' + safeScript(library) + '</script>')
      .replace(/<script src="share\.js(?:\?[^"]*)?"><\/script>/, () => '<script>' + safeScript(sharing) + '</script>')
      .replace(/<script src="classic-artwork\.js(?:\?[^"]*)?"><\/script>/, () => '<script>' + safeScript(artwork) + '</script>')
      .replace(/<script src="app\.js(?:\?[^"]*)?"><\/script>/, () => '<script>' + safeScript(app) + '</script>');
  }
  const api = { encode, decode, fingerprint, standalone, storageKey, snapshot, compact, publishedLink, siteUrl };
  global.TalentForgeShare = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
