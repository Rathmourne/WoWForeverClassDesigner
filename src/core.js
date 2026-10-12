(function (global) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const sum = (tree, ranks) => tree.talents.reduce((n, t) => n + (ranks[t.id] || 0), 0);
  const total = c => c.trees.reduce((n, t) => n + sum(t, c.ranks), 0);
  const required = (c, t) => t.requiredPoints == null ? t.row * c.pointsPerTier : t.requiredPoints;
  const earlierPoints = (tree, talent, ranks) => tree.talents.filter(t => t.row < talent.row).reduce((n, t) => n + (ranks[t.id] || 0), 0);
  function unmet(c, tree, talent, ranks = c.ranks) {
    const needed = required(c, talent);
    if (earlierPoints(tree, talent, ranks) < needed) return `Requires ${needed} points in earlier tiers of ${tree.name}.`;
    if (talent.prerequisite) {
      const parent = tree.talents.find(t => t.id === talent.prerequisite);
      if (!parent || (ranks[parent.id] || 0) < parent.maxRanks) return `Requires ${parent ? parent.maxRanks + ' points in ' + parent.name : 'a valid prerequisite'}.`;
    }
    return '';
  }
  function normalizeRanks(c) {
    const known = new Set(c.trees.flatMap(tree => tree.talents.map(t => t.id)));
    for (const id of Object.keys(c.ranks)) if (!known.has(id)) delete c.ranks[id];
    for (const tree of c.trees) {
      for (const t of tree.talents) {
        c.ranks[t.id] = Math.max(0, Math.min(t.maxRanks, Math.floor(Number(c.ranks[t.id]) || 0)));
      }
      // Same-tier Forever dependencies can put a parent after its child in slot order.
      for(let pass=0;pass<tree.talents.length;pass++){
        let changed=false;
        for(const t of tree.talents)if(c.ranks[t.id]>0&&unmet(c,tree,t)){c.ranks[t.id]=0;changed=true;}
        if(!changed)break;
      }
    }
    if (total(c) > c.pointBudget) {
      const reverse = c.trees.flatMap(tree => tree.talents).sort((a, b) => b.row - a.row);
      for (const talent of reverse) {
        while (c.ranks[talent.id] > 0 && total(c) > c.pointBudget) c.ranks[talent.id]--;
      }
      return normalizeRanks(c);
    }
    return c;
  }
  function allocate(c, tree, talent, delta) {
    const rank = c.ranks[talent.id] || 0;
    if (delta > 0) {
      if (rank >= talent.maxRanks) return { ok: false, message: 'This talent is already at its maximum rank.' };
      if (total(c) >= c.pointBudget) return { ok: false, message: 'No talent points left. Refund a point or change the class budget.' };
      const reason = unmet(c, tree, talent);
      if (reason) return { ok: false, message: reason };
    } else {
      if (rank <= 0) return { ok: false, message: 'There are no points to refund here.' };
      const proposed = { ...c.ranks, [talent.id]: rank - 1 };
      const affected = tree.talents.find(t => proposed[t.id] > 0 && unmet(c, tree, t, proposed));
      if (affected) return { ok: false, message: `Refund ${affected.name} first; it depends on these points.` };
    }
    c.ranks[talent.id] = rank + (delta > 0 ? 1 : -1);
    return { ok: true };
  }
  function safeImage(value) {
    return typeof value === 'string' && value.length < 2800000 && (/^assets\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..') || /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(value));
  }
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function integer(value, lo, hi) { return Number.isInteger(value) && value >= lo && value <= hi; }
  function validId(value) { return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value) && !['__proto__','constructor','prototype'].includes(value); }
  function validateProject(input) {
    assert(input && input.schemaVersion === 1, 'Choose a WoW Forever Class Designer project export (schema version 1).');
    assert(Array.isArray(input.classes) && input.classes.length > 0 && input.classes.length <= 50, 'A project must contain 1–50 classes.');
    const cids = new Set();
    for (const c of input.classes) {
      assert(validId(c.id) && !cids.has(c.id), 'Class IDs must be valid and unique.'); cids.add(c.id);
      assert(typeof c.name === 'string' && c.name.trim().length > 0 && c.name.length <= 80, 'Class names must be 1–80 characters.');
      assert(typeof c.description === 'string' && c.description.length <= 2000, 'Invalid class description.');
      assert(/^#[0-9a-fA-F]{6}$/.test(c.color), 'Invalid class color.');
      assert(safeImage(c.icon), 'Class icons must be local assets or uploaded images.');
      assert(integer(c.pointBudget, 0, 200) && integer(c.pointsPerTier, 0, 20), 'Invalid talent point rules.');
      assert(integer(c.startLevel, 1, 90) && integer(c.levelCap, c.startLevel, 100), 'Invalid level rules.');
      assert(Array.isArray(c.trees) && c.trees.length === 3, 'Each classic class must have three talent trees.');
      const ids = new Set();
      for (const tree of c.trees) {
        assert(validId(tree.id) && !ids.has(tree.id), 'Tree IDs must be valid and unique.'); ids.add(tree.id);
        assert(typeof tree.name === 'string' && tree.name.trim().length > 0 && tree.name.length <= 60, 'Invalid tree name.');
        assert(safeImage(tree.icon) && safeImage(tree.background), 'Invalid tree artwork.');
        assert(Array.isArray(tree.talents) && tree.talents.length <= 28, 'A tree has at most 28 talent slots.');
        const slots = new Set();
        for (const talent of tree.talents) {
          assert(validId(talent.id) && !ids.has(talent.id), 'Talent IDs must be valid and unique.'); ids.add(talent.id);
          assert(talent.damageModifiers==null || typeof talent.damageModifiers==='string'&&talent.damageModifiers.length<=12000,'Invalid talent spell modifiers.');
          assert(typeof talent.name === 'string' && talent.name.trim().length > 0 && talent.name.length <= 100, 'Invalid talent name.');
          assert(typeof talent.description === 'string' && talent.description.length <= 12000 && safeImage(talent.icon), 'Invalid talent description or icon.');
          assert(integer(talent.row, 0, 6) && integer(talent.col, 0, 3), 'Talent positions must fit the seven-tier, four-column grid.');
          const slot = `${talent.row}:${talent.col}`; assert(!slots.has(slot), 'Two talents cannot occupy the same slot.'); slots.add(slot);
          assert(integer(talent.maxRanks, 1, 10), 'Talents can have 1–10 ranks.');
          assert(talent.requiredPoints == null || integer(talent.requiredPoints, 0, 200), 'Invalid talent tier requirement.');
          assert(Array.isArray(talent.rankDescriptions) && talent.rankDescriptions.length <= 10 && talent.rankDescriptions.every(v => typeof v === 'string' && v.length <= 12000), 'Invalid rank descriptions.');
          assert(typeof talent.valuePerRank === 'number' && Number.isFinite(talent.valuePerRank), 'Invalid rank value.');
          if (talent.arrow != null) {
            const a = talent.arrow;
            assert(a && ['auto','direct','elbow','left','right'].includes(a.route) && ['auto','bottom','left','right'].includes(a.startEdge) && ['auto','top','left','right'].includes(a.endEdge), 'Invalid dependency arrow route.');
            assert(integer(a.offset,-80,80) && integer(a.bend,-24,24), 'Invalid dependency arrow offsets.');
          }
        }
        for (const talent of tree.talents) {
          if (talent.prerequisite) {
            const parent = tree.talents.find(t => t.id === talent.prerequisite);
            assert(parent && parent.id!==talent.id && parent.row <= talent.row, 'Prerequisites must be in the same or an earlier tier of the same tree.');
            const visited=new Set([talent.id]);let node=parent;
            while(node){assert(!visited.has(node.id),'Prerequisite chains cannot contain cycles.');visited.add(node.id);node=tree.talents.find(t=>t.id===node.prerequisite);}
          }
        }
      }
      assert(Array.isArray(c.abilities) && c.abilities.length <= 300, 'A class can contain at most 300 abilities.');
      for (const a of c.abilities) {
        assert(a.damageModifiers==null || typeof a.damageModifiers==='string'&&a.damageModifiers.length<=12000,'Invalid spell damage modifiers.');
        assert(validId(a.id) && !ids.has(a.id), 'Ability IDs must be valid and unique.'); ids.add(a.id);
        assert(typeof a.name === 'string' && a.name.trim().length > 0 && a.name.length <= 100 && safeImage(a.icon), 'Invalid ability name or icon.');
        for (const key of ['description','cost','castTime','cooldown','range','school','effects','type']) assert(typeof a[key] === 'string' && a[key].length <= 12000, 'Invalid ability details.');
        assert(integer(a.level, 1, 100), 'Invalid ability level.');
      }
      assert(c.ranks && typeof c.ranks === 'object' && !Array.isArray(c.ranks), 'Invalid point allocations.');
      normalizeRanks(c);
    }
    return clone(input);
  }
  function description(talent, rank) {
    const value = talent.rankDescriptions[rank - 1] || talent.description;
    return value.replace(/\{rank\}/g, String(rank)).replace(/\{value\}/g, String(Number((talent.valuePerRank * rank).toFixed(3))));
  }
  function arrowPath(source, target, settings = {}) {
    const route = settings.route || 'auto', side = route === 'left' || route === 'right';
    const startEdge = settings.startEdge && settings.startEdge !== 'auto' ? settings.startEdge : side ? route : 'bottom';
    const endEdge = settings.endEdge && settings.endEdge !== 'auto' ? settings.endEdge : side ? route : 'top';
    function anchor(rect, edge) {
      const x = (rect.left + rect.right) / 2, y = (rect.top + rect.bottom) / 2;
      return edge === 'left' ? [rect.left - 2, y] : edge === 'right' ? [rect.right + 2, y] : edge === 'bottom' ? [x, rect.bottom + 2] : [x, rect.top - 2];
    }
    const s = anchor(source, startEdge), e = anchor(target, endEdge);
    const point = p => p.map(n => Number(n.toFixed(2))).join(' ');
    if (route === 'direct') return `M ${point(s)} L ${point(e)}`;
    const offset = Math.max(-80, Math.min(80, Number(settings.offset) || 0));
    const lead = (p, edge) => [p[0] + (edge === 'left' ? -10 : edge === 'right' ? 10 : 0), p[1] + (edge === 'bottom' ? 10 : edge === 'top' ? -10 : 0)];
    const a = lead(s, startEdge), b = lead(e, endEdge);
    if (side || offset !== 0 || startEdge !== 'bottom' || endEdge !== 'top') {
      const channel = route === 'left' ? Math.min(source.left, target.left) - 20 : route === 'right' ? Math.max(source.right, target.right) + 20 : (a[0] + b[0]) / 2;
      const lane = Math.max(4, Math.min(396, channel + offset));
      return `M ${point(s)} L ${point(a)} H ${Number(lane.toFixed(2))} V ${Number(b[1].toFixed(2))} H ${Number(b[0].toFixed(2))} L ${point(e)}`;
    }
    if (s[0] === e[0]) return `M ${point(s)} V ${Number(e[1].toFixed(2))}`;
    const bend = Math.max(a[1], Math.min(b[1], b[1] - 12 + (Number(settings.bend) || 0)));
    return `M ${point(s)} V ${Number(bend.toFixed(2))} H ${Number(e[0].toFixed(2))} V ${Number(e[1].toFixed(2))}`;
  }
  function classicConnection(tree, talent, preferred = talent.arrow?.route || 'auto') {
    const parent = tree.talents.find(t => t.id === talent.prerequisite);
    if (!parent || parent.row > talent.row) return null;
    const blocked = (row,col) => tree.talents.some(t => t.id !== parent.id && t.id !== talent.id && t.row === row && t.col === col);
    const rowClear = (row,a,b) => { for(let col=Math.min(a,b);col<=Math.max(a,b);col++)if(blocked(row,col))return false;return true; };
    const columnClear = (col,a,b) => { for(let row=a;row<=b;row++)if(blocked(row,col))return false;return true; };
    const start=[parent.col+.5,parent.row+.5],end=[talent.col+.5,talent.row+.5];
    if(parent.row===talent.row)return ['auto','direct'].includes(preferred)&&rowClear(parent.row,parent.col,talent.col)?{kind:'horizontal',points:[start,end]}:null;
    if (['auto','direct'].includes(preferred) && parent.col === talent.col && columnClear(parent.col,parent.row+1,talent.row-1))return {kind:'straight',points:[start,end]};
    if (['auto','elbow'].includes(preferred) && parent.col !== talent.col && rowClear(parent.row,parent.col,talent.col) && columnClear(talent.col,parent.row+1,talent.row-1))return {kind:'elbow',points:[start,[talent.col+.5,parent.row+.5],end]};
    if (preferred==='direct' || preferred==='elbow')return null;
    const lanes=[0,1,2,3].filter(col=>col!==parent.col&&col!==talent.col && (preferred==='auto'||preferred==='left'&&col<Math.min(parent.col,talent.col)||preferred==='right'&&col>Math.max(parent.col,talent.col))).sort((a,b)=>Math.abs(a-parent.col)-Math.abs(b-parent.col));
    for(const col of lanes){
      if(rowClear(parent.row,parent.col,col) && columnClear(col,parent.row,talent.row-1))return {kind:'lane',points:[start,[col+.5,parent.row+.5],[col+.5,talent.row],[talent.col+.5,talent.row],end]};
    }
    return null;
  }
  function validateArrowLayouts(project) {
    for(const c of project.classes)for(const tree of c.trees)for(const t of tree.talents){
      if(t.prerequisite && !classicConnection(tree,t))throw new Error(`${t.name}: this prerequisite arrow crosses an occupied talent slot. Choose another source/route, or move the blocking talent.`);
    }
    return project;
  }
  function fixStarterArrows(project) {
    if(project.classicArrowVersion===2)return project;
    const groups={
      'death-knight':[['Rune Tap','Vampiric Blood','Bloody Vengeance','Dancing Rune Weapon','Heart Strike'],['Black Ice','Rime','Endless Winter','Breath of Sindragosa','Howling Blast'],['Ravenous Dead','Dark Transformation','Desecration','Summon Gargoyle','Scourge Strike']],
      'demon-hunter':[['Felblade','Essence Break','Trail of Ruin','Metamorphosis','Glaive Tempest'],['Soul Cleave','Fiery Brand','Feed the Demon','Fel Devastation','Sigil of Chains'],['Bouncing Glaives','Flamebound','Soul Rending','Fel Ascendance','The Hunt']],
      'monk':[['Elusive Brawler','Fortifying Brew','Brew-Stache','Invoke Niuzao','Exploding Keg'],['Rising Sun Kick','Invoke Xuen','Whirling Dragon Punch','Serenity','Storm, Earth, and Fire'],['Life Cocoon','Invoke Yu’lon','Mist Wrap','Invoke Chi-Ji','Revival']]
    };
    for(const c of project.classes){
      for(const names of groups[c.sourceSlug]||[]){
        const tree=c.trees.find(tr=>tr.talents.some(t=>t.name===names[1]));if(!tree)continue;
        const find=name=>tree.talents.find(t=>t.name===name);
        const old=find(names[0]),middle=find(names[1]),newMiddle=find(names[2]),last=find(names[3]),newLast=find(names[4]);
        if(old&&middle&&newMiddle&&middle.prerequisite===old.id&&!classicConnection(tree,middle)){middle.prerequisite=newMiddle.id;middle.arrow={route:'auto',startEdge:'auto',endEdge:'auto',offset:0,bend:0};}
        if(middle&&last&&newLast&&last.prerequisite===middle.id&&!classicConnection(tree,last)){last.prerequisite=newLast.id;last.arrow={route:'auto',startEdge:'auto',endEdge:'auto',offset:0,bend:0};}
      }
      normalizeRanks(c);
    }
    project.classicArrowVersion=2;return project;
  }
  const api = { clone, sum, total, required, earlierPoints, unmet, normalizeRanks, allocate, validateProject, safeImage, description, arrowPath, classicConnection, validateArrowLayouts, fixStarterArrows };
  global.TalentForgeCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
