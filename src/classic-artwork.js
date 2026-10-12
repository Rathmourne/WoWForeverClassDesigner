(function () {
  'use strict';
  // Only resample the painted background layer. Icons and SVG arrows keep their
  // original resolution, and the stored project still points to its original art.
  const cache = new Map();
  const bundled = /^assets\/spec-backgrounds\/(?:blood|frost|unholy|havoc|vengeance|felcraft|martial-arts|zealot|devotion)\.webp(?:\?v=[\w-]+)?$/;
  function texture(source) {
    if (!cache.has(source)) cache.set(source, new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        try {
          const small = document.createElement('canvas');
          small.width = 256;
          small.height = Math.round(image.naturalHeight * 256 / image.naturalWidth);
          const ctx = small.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(image, 0, 0, small.width, small.height);
          resolve(small.toDataURL('image/webp', 0.84));
        } catch { resolve(null); }
      };
      image.onerror = () => resolve(null);
      image.src = source;
    }));
    return cache.get(source);
  }
  function paint(node) {
    const source = node.dataset.classicArtwork;
    if (!bundled.test(source || '')) {
      node.style.removeProperty('--classic-artwork');
      return;
    }
    texture(source).then(url => {
      if (!url || !node.isConnected || node.dataset.classicArtwork !== source) return;
      if (node.tagName === 'IMG') node.src = url;
      else node.style.setProperty('--classic-artwork', `url("${url}")`);
    });
  }
  function scan(node) {
    if (node.nodeType !== 1) return;
    if (node.matches('[data-classic-artwork]')) paint(node);
    node.querySelectorAll('[data-classic-artwork]').forEach(paint);
  }
  window.ClassicArtwork = {supports: source => bundled.test(source || ''), texture};
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') paint(record.target);
      else record.addedNodes.forEach(scan);
    }
  }).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['data-classic-artwork']});
  scan(document.body);
})();
