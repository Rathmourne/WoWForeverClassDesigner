(function (global) {
  'use strict';
  const maxBytes = 2 * 1024 * 1024;
  async function encode(project) {
    const raw = new TextEncoder().encode(JSON.stringify(project));
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
    return JSON.parse(await new Blob(chunks).text());
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
  const api = { encode, decode, fingerprint, standalone, storageKey, snapshot };
  global.TalentForgeShare = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
