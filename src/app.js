(async function () {
  'use strict';
  const C = window.TalentForgeCore;
  const Library = window.TalentForgeLibrary;
  const references = window.WOW_REFERENCE || [];
  const allEntries = references.flatMap(c => c.entries.map(e => ({ ...e, className: c.name, classSlug: c.slug, gameVersion: c.gameVersion })));
  const bottomClasses = new Set(['death-knight','demon-hunter','monk']);
const classNavigation = classes => [...classes].sort((a,b) => Number(bottomClasses.has(a.sourceSlug))-Number(bottomClasses.has(b.sourceSlug)));
const artworkUrl = value => /^assets\/spec-backgrounds\/(?:blood|unholy|havoc|vengeance|felcraft|martial-arts|zealot|devotion)\.webp$/.test(value) ? value+'?v=20261012-classic1' : value;
const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = prefix => prefix + '-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const fallback = 'assets/wowhead/inv_misc_questionmark.jpg';
  const Share = window.TalentForgeShare;
  const embeddedProject = window.TALENT_FORGE_SHARED_PROJECT;
  const playMode = !!embeddedProject || new URLSearchParams(location.search).get('play') === '1';
  const sharedPayload = new URLSearchParams(location.hash.slice(1)).get('project');
  const storageKey = Share.storageKey(playMode,sharedPayload,embeddedProject);
  const art = ['assets/shaman-elemental-combat.png', 'assets/shaman-enhancement.png', 'assets/shaman-restoration.png'];
  const specArtwork = [
    ['blood','Blood · Crimson fortress'],['frost','Frost · Frozen citadel'],['unholy','Unholy · Plagued necropolis'],
    ['havoc','Havoc · Shattered battlefield'],['vengeance','Vengeance · Obsidian bastion'],['felcraft','Felcraft · Ritual sanctuary'],
    ['martial-arts','Martial Arts · Fortified training hall'],['zealot','Zealot · Scarlet training ground'],['devotion','Devotion · Chapel of light']
  ].map(([slug,label])=>({slug,label,path:`assets/spec-backgrounds/${slug}.webp`}));
  const artOptions = [...art.map((path,i)=>[path,['Arcane sky','Storm peak','Spirit forest'][i]]),...specArtwork.map(a=>[a.path,a.label])];
  const findReference = (slug, name) => allEntries.find(e => e.classSlug === slug && e.name.toLowerCase() === name.toLowerCase());
  const source = entry => entry ? ({ spellId: entry.id, url: entry.sourceUrl, version: entry.gameVersion || 'Retail 12.1.0 / Midnight' }) : null;
  const layouts = [[0,0],[0,1],[0,2],[1,0],[1,1],[1,3],[2,0],[2,1],[2,2],[3,1],[3,2],[3,3],[4,0],[4,1],[4,3],[5,1],[5,2],[6,1]];
  const seeds = [
    { name: 'Death Knight', slug: 'death-knight', color: '#ce6472', icon: 'class_deathknight', description: 'Runebound steel. Frozen resolve. The power to turn death into a weapon.',
      trees: [
        ['Blood', 'Death Strike', ['Blade Barrier','Bladed Armor','Butchery','Scent of Blood','Rune Tap','Dark Conviction','Blood Tap','Veteran of the Third War','Improved Death Strike','Bloody Vengeance','Mark of Blood','Bloodworms','Spell Deflection','Vampiric Blood','Will of the Necropolis','Heart Strike','Blood Gorged','Dancing Rune Weapon']],
        ['Frost', 'Frost Strike', ['Improved Icy Touch','Runic Power Mastery','Toughness','Icy Reach','Black Ice','Icy Talons','Annihilation','Killing Machine','Chill of the Grave','Endless Winter','Frostscythe','Frigid Dreadplate','Glacier Rot','Rime','Improved Frost Strike','Howling Blast','Tundra Stalker','Breath of Sindragosa']],
        ['Unholy', 'Scourge Strike', ['Vicious Strikes','Virulence','Morbidity','Epidemic','Ravenous Dead','Unholy Command','Necrosis','Reaping','Outbreak','Desecration','Master of Ghouls','Dirge','Magic Suppression','Dark Transformation','Ebon Plaguebringer','Scourge Strike','Rage of Rivendare','Summon Gargoyle']]
      ], abilities: ['Death Grip','Death Coil','Death and Decay','Chains of Ice','Anti-Magic Shell','Raise Dead'] },
    { name: 'Demon Hunter', slug: 'demon-hunter', color: '#aa89d4', icon: 'class_demonhunter', description: 'A hunter shaped by sacrifice. Warglaives, fel fire, and relentless momentum.',
      trees: [
        ['Havoc', 'Eye Beam', ['Demon Blades','Burning Hatred','Critical Chaos','Improved Chaos Strike','Felblade','First Blood','Demonic Appetite','Blind Fury','Initiative','Trail of Ruin','Demonic','Furious Gaze','Unbound Chaos','Essence Break','Soul Rending','Glaive Tempest','Know Your Enemy','Metamorphosis']],
        ['Vengeance', 'Demon Spikes', ['Thick Skin','Fel Flame Fortification','Painbringer','Fracture','Soul Cleave','Fallout','Feast of Souls','Burning Alive','Soul Barrier','Feed the Demon','Spirit Bomb','Void Reaver','Last Resort','Fiery Brand','Soul Carver','Sigil of Chains','Revel in Pain','Fel Devastation']],
        ['Felcraft', 'Sigil of Flame', ['Fel Mastery','Unrestrained Fury','Illidari Knowledge','Charred Warblades','Bouncing Glaives','Consume Magic','Sigil of Misery','Demonic Wards','Concentrated Sigils','Soul Rending','Infernal Armor','Sigil of Silence','Darkness','Flamebound','Master of the Glaive','The Hunt','Demonic Resilience','Fel Ascendance']]
      ], abilities: ['Fel Rush','Chaos Strike','Eye Beam','Throw Glaive','Sigil of Flame','Spectral Sight'] },
    { name: 'Monk', slug: 'monk', color: '#70c6a6', icon: 'class_monk', description: 'Conviction through discipline. Scarlet zeal, devoted healing, and unyielding martial defense.',
      trees: [
        ['Martial Arts', 'Keg Smash', ['Stagger','Brewmaster’s Balance','Gift of the Ox','Purifying Brew','Elusive Brawler','Shuffle','Black Ox Brew','High Tolerance','Celestial Brew','Brew-Stache','Special Delivery','Dampen Harm','Guard','Fortifying Brew','Bob and Weave','Exploding Keg','Anvil & Stave','Invoke Niuzao']],
        ['Zealot', 'Fists of Fury', ['Tiger Strikes','Inner Peace','Fast Feet','Combo Breaker','Rising Sun Kick','Ascension','Hit Combo','Fists of Fury','Momentum','Whirling Dragon Punch','Touch of Karma','Dance of Chi-Ji','Energizing Elixir','Invoke Xuen','Spiritual Focus','Storm, Earth, and Fire','Jade Ignition','Serenity']],
        ['Devotion', 'Enveloping Mist', ['Soothing Mist','Grace of the Crane','Tear of Morning','Enveloping Mist','Life Cocoon','Mana Tea','Mists of Life','Jade Serpent Statue','Renewing Mist','Mist Wrap','Thunder Focus Tea','Lifecycles','Healing Elixir','Invoke Yu’lon','Rising Mist','Revival','Jade Bond','Invoke Chi-Ji']]
      ], abilities: ['Tiger Palm','Blackout Kick','Rising Sun Kick','Roll','Vivify','Paralysis'] }
  ];
  function seedClass(seed, index) {
    const ref = references.find(r => r.slug === seed.slug);
    const classEntries = ref ? ref.entries : [];
    const c = { id: uid('class'), name: seed.name, description: seed.description, color: seed.color,
      icon: 'assets/wowhead/' + seed.icon + '.jpg', sourceSlug: seed.slug,
      pointBudget: 51, pointsPerTier: 5, startLevel: 10, levelCap: 60, ranks: {}, abilities: [], trees: [] };
    c.trees = seed.trees.map(([name, primary, names], treeIndex) => {
      const mainRef = findReference(seed.slug, primary);
      const tree = { id: uid('tree'), name, icon: mainRef ? mainRef.icon : classEntries[treeIndex * 7]?.icon || fallback,
        background: specArtwork.find(a=>a.slug===name.toLowerCase().replace(/\s+/g,'-').replace(/\s+/g,'-'))?.path || art[(treeIndex + index) % 3], talents: [] };
      tree.talents = names.map((talentName, i) => {
        const reference = findReference(seed.slug, talentName) || allEntries.find(e => e.classSlug === seed.slug && e.name.toLowerCase().includes(talentName.toLowerCase()));
        const [row, col] = layouts[i];
        const maxRanks = row === 6 || [4,10,13,15].includes(i) ? 1 : [5,8,11,14].includes(i) ? 3 : 5;
        const fallbackIcon = classEntries.filter(e => e.kind !== 'Ability')[i + treeIndex * 18];
        return { id: uid('talent'), name: talentName, icon: reference?.icon || fallbackIcon?.icon || c.icon,
          description: maxRanks === 1
            ? `Unlocks ${talentName}, a signature technique of the ${name} path. Rewrite this draft effect to fit your classic class.`
            : `Increases the effectiveness of your ${name.toLowerCase()} techniques by {value}%.\n\nStacks with each rank.`,
          valuePerRank: maxRanks === 1 ? 1 : 2, rankDescriptions: [], row, col, maxRanks,
          requiredPoints: null, prerequisite: '', type: maxRanks === 1 ? 'Active' : 'Passive',
          school: name === 'Frost' ? 'Frost' : seed.slug === 'demon-hunter' ? 'Chaos' : 'Physical',
          source: source(reference) };
      });
      // Two intentional classic dependency chains per tree.
      tree.talents[13].prerequisite = tree.talents[4].id;
      tree.talents[17].prerequisite = tree.talents[13].id;
      return tree;
    });
    c.abilities = seed.abilities.map((name, i) => {
      const reference = findReference(seed.slug, name);
      return { id: uid('ability'), name, icon: reference?.icon || classEntries[i]?.icon || c.icon,
        description: reference?.description || `Rewrite ${name} to fit your classic class.`,
        type: reference?.passive ? 'Passive' : 'Active', level: Math.min(reference?.minLevel || 10, 60),
        cost: reference?.cost || 'None', castTime: reference?.castTime || 'Instant',
        cooldown: reference?.cooldown || 'None', range: reference?.range || 'Self',
        school: 'Unspecified', effects: '', source: source(reference) };
    });
    return c;
  }
  function renameStarterMonkSpecs(value) {
    const names={Brewmaster:'Martial Arts',Windwalker:'Zealot',Mistweaver:'Devotion'};
    for(const c of value.classes)if(c.name==='Monk'&&c.sourceSlug==='monk') {
      for(const tree of c.trees)if(names[tree.name])tree.name=names[tree.name];
      if(c.description==='Find balance in the battle. Master the brew, the wind, and the healing mist.')c.description=seeds[2].description;
    }
    return value;
  }
  function freshProject() { return renameStarterMonkSpecs(C.fixStarterArrows(window.TALENT_FORGE_DEFAULT_PROJECT ? C.clone(window.TALENT_FORGE_DEFAULT_PROJECT) : { schemaVersion: 1, title: 'Classic class workshop', classes: seeds.map(seedClass) })); }
  let project = freshProject();
  let restoreMessage = '';
  if (playMode && (embeddedProject || sharedPayload)) {
    try { project = C.validateProject(C.fixStarterArrows(embeddedProject ? C.clone(embeddedProject) : await Share.decode(sharedPayload))); }
    catch (error) { document.querySelector('main').textContent = 'Unable to open this calculator: ' + error.message; return; }
  }
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved && !playMode) project = renameStarterMonkSpecs(C.validateProject(C.fixStarterArrows(JSON.parse(saved))));
    if (saved && playMode) {
      const builds = JSON.parse(saved);
      for (const c of project.classes) {
        if (builds[c.id] && typeof builds[c.id] === 'object' && !Array.isArray(builds[c.id])) c.ranks = builds[c.id];
        C.normalizeRanks(c);
      }
    }
  }
  catch (error) { restoreMessage = 'A saved project could not be loaded. The starter classes are available; import a backup to recover your work.'; }
  const newArtwork=Library.migrateStarterArtwork(project);
  const newClasses=!embeddedProject&&!sharedPayload&&Library.mergeForeverClasses(project,window.WOW_FOREVER_CLASSES||[]);
  const newSpellDetails=Library.hydrateSpellDetails(project,references);
  if((newArtwork||newClasses||newSpellDetails)&&!playMode){
    try{localStorage.setItem(storageKey,JSON.stringify(project));}catch(error){restoreMessage='Spec backgrounds applied. Export a backup if browser storage is full.';}
  }
  const entry = new URLSearchParams(location.search);
  const requestedClass = project.classes.find(c=>c.id===entry.get('class')||c.sourceSlug===entry.get('class'));
  let activeId = requestedClass?.id || classNavigation(project.classes)[0].id, view = entry.get('view')==='abilities'?'abilities':'talents', mode = !playMode&&entry.get('mode')==='design'?'design':'build', selection = null;
  let libraryQuery = '', libraryKind = 'All', libraryPage = 0;
  let abilityQuery='',shareScope='current',shareIncludeRanks=false;
  let undoStack = [], redoStack = [], toastTimer;
  const current = () => project.classes.find(c => c.id === activeId) || project.classes[0];
  function selected() {
    const c = current();
    if (selection?.kind === 'talent') {
      for (const tree of c.trees) { const t = tree.talents.find(t => t.id === selection.id); if (t) return { item: t, tree }; }
    }
    if (selection?.kind === 'ability') { const a = c.abilities.find(a => a.id === selection.id); if (a) return { item: a }; }
    return null;
  }
  function selectDefault() {
    const c = current();
    selection = view === 'abilities' && c.abilities[0] ? { kind: 'ability', id: c.abilities[0].id }
      : view !== 'abilities' && c.trees[0].talents[0] ? { kind: 'talent', id: c.trees[0].talents[0].id } : null;
  }
  function toast(message) {
    $('toast').textContent = message; $('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
  }
  function save() {
    try {
      const saved = playMode ? Object.fromEntries(project.classes.map(c => [c.id, c.ranks])) : project;
      localStorage.setItem(storageKey, JSON.stringify(saved)); $('save-status').textContent = playMode ? 'Your build is saved' : 'Saved on this device';
    }
    catch (error) { $('save-status').textContent = 'Storage unavailable'; toast('Browser storage is unavailable or full. Use Share to keep a copy.'); }
  }
  function mutate(action) {
    const before = C.clone(project); action();
    if(mode==='design'){
      try{C.validateArrowLayouts(project);}catch(error){project=before;if(!selected())selectDefault();render();toast(error.message);return false;}
    }
    if (JSON.stringify(before) === JSON.stringify(project)) return;
    undoStack.push(before); if (undoStack.length > 25) undoStack.shift(); redoStack = [];
    save(); render();
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(C.clone(project)); project = undoStack.pop();
    if (!project.classes.some(c => c.id === activeId)) activeId = project.classes[0].id;
    if (!selected()) selectDefault(); save(); render(); toast('Last change undone.');
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(C.clone(project)); project = redoStack.pop();
    if (!project.classes.some(c => c.id === activeId)) activeId = project.classes[0].id;
    if (!selected()) selectDefault(); save(); render(); toast('Change restored.');
  }
  function render() {
    document.querySelector('.calculator-home').href='./?'+new URLSearchParams({class:current().id,view:view==='abilities'?'abilities':'talents'});
    const c = current(); document.documentElement.style.setProperty('--class', c.color);
    $('class-list').innerHTML=classNavigation(project.classes).map(k => `<button class="class-nav ${k.id === c.id ? 'active' : ''}" style="--nav-color:${esc(k.color)}" data-class-id="${esc(k.id)}" aria-pressed="${k.id === c.id}"><img src="${esc(k.icon)}" alt=""><div><span>${esc(k.name)}</span><small>${k.trees.map(t => esc(t.name)).join(' · ')}</small></div></button>`).join('');
    $('breadcrumb-class').textContent = c.name; $('class-name').textContent = c.name;
    $('class-description').textContent = c.description; $('class-icon').src = c.icon;
    $('ability-count').textContent = c.abilities.length;
    $('library-count').textContent = allEntries.length.toLocaleString();
    $('tab-talents').classList.toggle('active', view === 'talents'); $('tab-talents').setAttribute('aria-selected', view === 'talents');
    $('tab-abilities').classList.toggle('active', view === 'abilities'); $('tab-abilities').setAttribute('aria-selected', view === 'abilities');
    $('workspace').setAttribute('aria-labelledby', view === 'abilities' ? 'tab-abilities' : 'tab-talents');
    for (const name of ['build', 'design']) { $('mode-' + name).classList.toggle('active', mode === name); $('mode-' + name).setAttribute('aria-pressed', mode === name); }
    $('undo').disabled = !undoStack.length; $('redo').disabled = !redoStack.length;
    $('tooltip').hidden = true;
    if (view === 'talents') renderTalents(); else if (view === 'abilities') renderAbilities(); else renderLibrary();
    renderInspector();
    if(view==='talents')requestAnimationFrame(()=>drawDependencyArrows());
  }
  function renderTalents() {
    const c = current(), spent = C.total(c), requiredLevel = spent ? Math.min(c.levelCap, c.startLevel + spent - 1) : c.startLevel - 1;
    const grid = c.trees.map(tree => {
      const nodes = Array.from({ length: 28 }, (_, index) => {
        const row = Math.floor(index / 4), col = index % 4;
        const t = tree.talents.find(t => t.row === row && t.col === col);
        if (!t) return `<div class="talent-cell">${mode === 'design' ? `<button class="empty-slot" data-action="add-talent" data-tree="${esc(tree.id)}" data-row="${row}" data-col="${col}" aria-label="Add talent in ${esc(tree.name)}, tier ${row + 1}, column ${col + 1}">＋</button>` : ''}</div>`;
        const rank = c.ranks[t.id] || 0, locked = !!C.unmet(c, tree, t);
        const state = rank === t.maxRanks ? 'maxed' : rank > 0 ? 'allocated' : locked ? 'locked' : 'available';
        return `<div class="talent-cell">${col === 0 ? `<span class="tier-indicator" aria-hidden="true">${row ? row * c.pointsPerTier : ''}</span>` : ''}<button class="talent-node ${state} ${selection?.id === t.id ? 'selected' : ''}" data-talent-id="${esc(t.id)}" data-tree="${esc(tree.id)}" aria-label="${esc(t.name)}, rank ${rank} of ${t.maxRanks}${locked ? ', locked' : ''}"><img src="${esc(t.icon)}" alt="" draggable="false"><span class="rank-badge">${rank}/${t.maxRanks}</span></button></div>`;
      }).join('');
      const arrowId = 'arrow-' + tree.id;
      const arrows = '';
      return `<section class="tree-panel" aria-label="${esc(tree.name)} talent tree"><div class="tree-title"><img src="${esc(tree.icon)}" alt=""><h2>${esc(tree.name)}</h2><span class="tree-points" aria-label="Points in ${esc(tree.name)}">${C.sum(tree,c.ranks)}</span><button class="quiet" data-action="${mode === 'design' ? 'tree-settings' : 'reset-tree'}" data-tree="${esc(tree.id)}" aria-label="${mode === 'design' ? 'Edit' : 'Reset'} ${esc(tree.name)}">${mode === 'design' ? '⚙' : '↺'}</button></div><div class="tree-art" data-classic-artwork="${esc(artworkUrl(tree.background))}" style="--tree-image:url('${esc(artworkUrl(tree.background))}')"><svg class="arrows" viewBox="0 0 400 476" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="${arrowId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 1 1 L 9 5 L 1 9 Z" fill="#a39b7b" stroke="#13120e" stroke-width="1"/></marker></defs>${arrows}</svg><div class="talent-grid">${nodes}</div></div><div class="tree-bottom"><span>${tree.talents.length} TALENTS</span><span>${C.sum(tree,c.ranks)} POINTS SPENT</span></div></section>`;
    }).join('');
    $('canvas').innerHTML = `<div class="allocation-bar"><div class="allocation"><strong>${c.pointBudget - spent}</strong><span>points left</span></div><div class="level">POINTS SPENT <b>${spent} / ${c.pointBudget}</b><br>REQUIRED LEVEL <b>${requiredLevel}</b></div><button class="secondary" data-action="reset-all">↺ Reset build</button></div><div class="tree-grid">${grid}</div><div class="canvas-legend"><span><i class="legend-dot available"></i>Available</span><span><i class="legend-dot maxed"></i>Maxed</span><span><i class="legend-dot"></i>Locked</span><span class="hint">${mode === 'build' ? 'Click +1 · Right-click −1 · Select for details' : 'Select a talent to edit · ＋ adds a new talent'}</span></div>`;
  }
  function drawDependencyArrows(draft) {
    if(view!=='talents')return;
    const c=current();
    for(const tree of c.trees){
      const svg=document.getElementById('arrow-'+tree.id)?.closest('svg');if(!svg)continue;
      const box=svg.getBoundingClientRect();if(!box.width||!box.height)continue;
      svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
      const bounds=id=>{
        const rect=document.querySelector(`[data-talent-id="${CSS.escape(id)}"]`)?.getBoundingClientRect();
        return rect?{left:rect.left-box.left,right:rect.right-box.left,top:rect.top-box.top,bottom:rect.bottom-box.top}:null;
      };
      const working={...tree,talents:tree.talents.map(t=>draft?.id===t.id?draft:t)};
      const defs=[],paths=[];
      for(const t of working.talents){
        if(!t.prerequisite)continue;
        const parent=working.talents.find(p=>p.id===t.prerequisite),plan=C.classicConnection(working,t);
        if(!parent||!plan)continue;
        const s=bounds(parent.id),e=bounds(t.id);if(!s||!e)continue;
        const points=plan.points.map(p=>[p[0]*box.width/4,p[1]*box.height/7]);
        const horizontal=plan.points[0][1]===plan.points[1][1];
        points[0]=horizontal?[plan.points[1][0]>plan.points[0][0]?s.right+1:s.left-1,(s.top+s.bottom)/2]:[(s.left+s.right)/2,s.bottom+1];
        points[points.length-1]=plan.kind==='horizontal'?[parent.col<t.col?e.left-2:e.right+2,(e.top+e.bottom)/2]:[(e.left+e.right)/2,e.top-2];
        if(plan.kind==='elbow')points[1]=[(e.left+e.right)/2,(s.top+s.bottom)/2];
        if(plan.kind==='lane'){
          const offset=Math.max(-6,Math.min(6,Number(t.arrow?.offset)||0));
          points[1][0]+=offset;points[2][0]+=offset;points[1][1]=(s.top+s.bottom)/2;points[3][0]=(e.left+e.right)/2;
        }
        const path=points.map((p,i)=>(i?'L':'M')+' '+p.map(n=>Number(n.toFixed(2))).join(' ')).join(' ');
        const unlocked=(c.ranks[parent.id]||0)===parent.maxRanks,color=unlocked?'#d1b968':'#858985',highlight=unlocked?'#eee1aa':'#b7bbb5';
        const marker='classic-head-'+t.id;
        defs.push(`<marker id="${esc(marker)}" markerUnits="userSpaceOnUse" viewBox="0 0 16 16" refX="14" refY="8" markerWidth="16" markerHeight="16" orient="auto"><path d="M 1 1 L 14 8 L 1 15 L 4 8 Z" fill="${color}" stroke="#252825" stroke-width="2"/></marker>`);
        paths.push(`<g data-arrow-target="${esc(t.id)}"><title>${esc(parent.name)} → ${esc(t.name)} · Requires ${parent.maxRanks}/${parent.maxRanks}</title><path d="${path}" fill="none" stroke="#0b0d0d" stroke-width="12" stroke-linejoin="miter"/><path d="${path}" fill="none" stroke="#343935" stroke-width="10" stroke-linejoin="miter"/><path d="${path}" fill="none" stroke="${color}" stroke-width="6" stroke-linejoin="miter"/><path d="${path}" fill="none" stroke="${highlight}" stroke-width="1" transform="translate(-1,-1)"/><path d="${path}" fill="none" stroke="transparent" stroke-width="1" marker-end="url(#${esc(marker)})"/></g>`);
      }
      svg.innerHTML='<defs>'+defs.join('')+'</defs>'+paths.join('');
      // Keep a stable marker anchor for redraws when every dependency is temporarily removed.
      svg.querySelector('defs').insertAdjacentHTML('afterbegin',`<marker id="arrow-${esc(tree.id)}"></marker>`);
    }
  }
  function arrowEditor(item,tree){
    const a={route:'auto',offset:0,...item.arrow};
    return `<fieldset class="arrow-editor wide-field"><legend>Classic prerequisite arrow</legend>${selectField('Arrow from (fully ranked prerequisite)','prerequisite',item.prerequisite,[['','None — no prerequisite or arrow'],...tree.talents.filter(t=>t.id!==item.id&&t.row<=item.row).map(t=>[t.id,t.name])])}<p class="help">This is the actual talent that must be maxed. Arrows cannot pass through another talent’s slot.</p>${selectField('Arrow route','arrowRoute',a.route,[['auto','Automatic classic route'],['direct','Straight to target'],['elbow','Right-angle bend to target column'],['left','Through an empty column on the left'],['right','Through an empty column on the right']])}${field('Empty-column lane offset','arrowOffset',a.offset,'number','min="-6" max="6" step="1"')}<p class="help">If a route is blocked, choose another source or move the blocking talent. Apply changes saves the prerequisite and arrow together.</p><p id="arrow-route-status" class="help ${item.prerequisite&&!C.classicConnection(tree,item)?'route-blocked':''}">${!item.prerequisite?'No prerequisite arrow.':C.classicConnection(tree,item)?'Clear route — no occupied slots crossed.':'Blocked route. This connection cannot be saved.'}</p></fieldset>`;
  }
  function preview(item, talent = false, tree) {
    const c = current(), rank = talent ? c.ranks[item.id] || 0 : 1;
    const displayRank = Math.max(1, rank);
    return `<div class="spell-preview"><div class="spell-name">${esc(item.name)}</div>${talent ? `<div class="spell-meta"><span>${esc(item.type || 'Passive')}</span><span>Rank ${displayRank}/${item.maxRanks}</span></div><div>Requires ${esc(c.name)}</div>` : `<div class="spell-meta"><span>${esc(item.cost)}</span><span>${esc(item.range)}</span></div><div class="spell-meta"><span>${esc(item.type === 'Passive' ? 'Passive' : item.castTime)}</span><span>${esc(item.cooldown === 'None' ? '' : item.cooldown)}</span></div><div>Requires ${esc(c.name)} · Level ${item.level}</div>`}<p class="spell-description">${esc(talent ? C.description(item, displayRank) : item.description || (item.sourceMissingDescription ? 'Effect description is not yet provided by the Forever reference. Add your own rewrite in Design mode.' : ''))}</p>${talent && rank < item.maxRanks && rank > 0 ? `<div class="next-rank">Next rank:<p>${esc(C.description(item, rank + 1))}</p></div>` : ''}${talent && C.unmet(c, tree, item) ? `<p class="spell-requirement">${esc(C.unmet(c,tree,item))}</p>` : ''}</div>`;
  }
  function renderInspector() {
    const entry = selected();
    const label = view === 'library' ? 'REFERENCE LIBRARY' : mode === 'design' ? 'DESIGN INSPECTOR' : 'SPELL PREVIEW';
    if (!entry) {
      $('inspector').innerHTML = `<div class="inspector-header">${label}</div><div class="inspector-body"><div class="empty-state">${view === 'library' ? 'Preview a reference, then copy it into your class.' : 'Select a talent or ability to see its details.'}</div><div class="design-invite">${view === 'library' ? 'Downloaded reference data is retained separately. Your classic talents and ability rewrites are editable copies.' : 'Switch to Design to add talents, edit ranks, and rewrite abilities.'}</div></div>`; return;
    }
    const { item, tree } = entry, talent = !!tree;
    $('inspector').innerHTML = `<div class="inspector-header">${label}<span>${talent ? 'TALENT' : 'ABILITY'}</span></div><div class="inspector-body"><div class="selected-title"><img src="${esc(item.icon)}" alt=""><div><h2>${esc(item.name)}</h2><small>${talent ? esc(tree.name) + ' · Tier ' + (item.row + 1) : esc(item.type) + ' · Level ' + item.level}</small></div></div>${mode === 'design' && view !== 'library' ? editForm(item, tree) : `${preview(item,talent,tree)}${talent ? `<div class="selection-controls"><span>Allocated ranks</span><div class="rank-controls"><button data-action="rank-minus" aria-label="Refund selected talent point">−</button><span>${current().ranks[item.id] || 0} / ${item.maxRanks}</span><button data-action="rank-plus" aria-label="Allocate selected talent point">＋</button></div></div>` : ''}<div class="inspector-label">${talent ? 'Talent' : 'Spell'} details</div><dl class="details-grid"><div><dt>${talent ? 'Max ranks' : 'Range'}</dt><dd>${talent ? item.maxRanks : esc(item.range)}</dd></div><div><dt>${talent ? 'Points required' : 'Cast time'}</dt><dd>${talent ? C.required(current(),item) : esc(item.castTime)}</dd></div><div><dt>School</dt><dd>${esc(item.school || 'Unspecified')}</dd></div><div><dt>${talent ? 'Prerequisite' : 'Cooldown'}</dt><dd>${talent ? esc(tree.talents.find(t => t.id === item.prerequisite)?.name || 'None') : esc(item.cooldown)}</dd></div></dl><div class="design-invite">Make this class your own.<button class="secondary" data-action="enter-design">✎ Edit ${talent ? 'talent' : 'ability'}</button></div>`}</div>`;
  }
  function field(label, name, value, type = 'text', attrs = '') { return `<label>${label}<input name="${name}" aria-label="${esc(label)}" type="${type}" value="${esc(value)}" ${attrs}></label>`; }
  function selectField(label, name, value, options) { return `<label>${label}<select name="${name}" aria-label="${esc(label)}">${options.map(o => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select></label>`; }
  function editForm(item, tree) {
    const talent = !!tree, c = current();
    const currentRank = talent ? Math.max(1,c.ranks[item.id] || 0) : 1;
    return `<form id="item-edit" class="edit-form"><input type="hidden" name="icon" value="${esc(item.icon)}">${!talent?'<div class="wide-field"><button type="button" class="secondary template-start" data-action="ability-template">Start from a WoW ability</button><p class="help">Load an existing spell, then rewrite it.</p></div>':''}<div class="wide-field icon-field"><span>Icon</span><div class="icon-picker-row"><img src="${esc(item.icon)}" alt="Current icon"><button type="button" data-action="pick-icon">Choose icon</button><button type="button" data-action="upload-icon">Upload</button></div></div><div class="wide-field">${field('Name','name',item.name,'text','maxlength="100" required')}</div>${talent ? `<div class="field-row wide-field">${field('Maximum ranks','maxRanks',item.maxRanks,'number','min="1" max="10" required')}${selectField('Type','type',item.type,['Passive','Active'])}</div><div class="field-row wide-field">${selectField('Tier','row',item.row,Array.from({length:7},(_,i)=>[i,`Tier ${i+1}`]))}${selectField('Column','col',item.col,[0,1,2,3].map(i=>[i,`${i+1}`]))}</div>${arrowEditor(item,tree)}<div class="field-row wide-field">${field('Tier points (blank = automatic)','requiredPoints',item.requiredPoints ?? '', 'number','min="0" max="200"')}${field('Value per rank','valuePerRank',item.valuePerRank,'number','step="any" required')}</div>` : `<div class="field-row wide-field">${selectField('Type','type',item.type,['Active','Passive'])}${field('Learned at level','level',item.level,'number','min="1" max="100" required')}</div><div class="field-row wide-field">${field('Resource cost','cost',item.cost)}${field('Range','range',item.range)}</div><div class="field-row wide-field">${field('Cast time','castTime',item.castTime)}${field('Cooldown','cooldown',item.cooldown)}</div>`}<div class="wide-field">${selectField('School','school',item.school || 'Unspecified',[...new Set(['Unspecified','Physical','Frost','Shadow','Fire','Nature','Arcane','Holy','Chaos',item.school||'Unspecified'])])}</div><label class="wide-field">${talent ? 'Rank description template' : 'Ability description'}<textarea name="description" aria-label="${talent ? 'Rank description template' : 'Ability description'}" maxlength="12000" required>${esc(item.description)}</textarea></label>${talent ? `<p class="help wide-field">Use {value} for value × rank, or {rank} for the rank number.</p><label class="wide-field">Optional description per rank (one line per rank)<textarea name="rankDescriptions" aria-label="Optional description per rank" placeholder="Rank 1 description&#10;Rank 2 description">${esc(item.rankDescriptions.join('\n'))}</textarea></label>` : `<label class="wide-field">Effects (one per line)<textarea name="effects" aria-label="Effects (one per line)" placeholder="Deals 100 Shadow damage&#10;Generates 10 Runic Power">${esc(item.effects)}</textarea></label>`}<label class="wide-field">Spell damage modifiers (one per line)<textarea name="damageModifiers" aria-label="Spell damage modifiers (one per line)" maxlength="12000" placeholder="Spell Power coefficient: 0.714 (71.4%)">${esc(item.damageModifiers||'')}</textarea></label><div class="editor-actions"><button type="button" class="quiet danger" data-action="delete-item">Delete ${talent ? 'talent' : 'ability'}</button><button class="gold" type="submit">Apply changes</button></div><div class="wide-field"><div class="inspector-label">Live preview · ${talent ? 'Rank '+currentRank : 'Ability'}</div><div id="live-preview">${preview(item,talent,tree)}</div></div></form>`;
  }
  function abilityCards() {
    const needle=abilityQuery.toLowerCase(),abilities=current().abilities.filter(a=>!needle||`${a.name} ${a.level} ${a.source?.spellId||''}`.toLowerCase().includes(needle));
    return abilities.map(item=>`<button class="ability-card ${selection?.id===item.id?'active':''}" data-ability-id="${esc(item.id)}" aria-pressed="${selection?.id===item.id}"><img src="${esc(item.icon)}" alt=""><div><strong>${esc(item.name)}</strong><small>${esc(item.type)} · Level ${item.level} · ${esc(item.school)}</small></div></button>`).join('')||'<p class="muted">No matching abilities.</p>';
  }

  function selectAbility(id){
    const item=current().abilities.find(a=>a.id===id);if(!item)return;
    const pageX=window.scrollX,pageY=window.scrollY,list=document.getElementById("ability-results"),listTop=list?.scrollTop||0;
    selection={kind:"ability",id};
    for(const card of document.querySelectorAll("[data-ability-id]")){const active=card.dataset.abilityId===id;card.classList.toggle("active",active);card.setAttribute("aria-pressed",String(active));}
    const a=item,detail=document.querySelector(".ability-detail");
    if(detail)detail.outerHTML=`<article class="ability-detail"><h2><img src="${esc(a.icon)}" alt="">${esc(a.name)}</h2>${preview(a)}<h3>Spell Details</h3><div class="spell-details-table">${[['Range',a.range],['Cast time',a.castTime],['Resource cost',a.cost],['Cooldown',a.cooldown],['Type',a.type],['School',a.school]].map(([label,value])=>`<div><span>${label}</span><p>${esc(value)}</p></div>`).join('')}</div><h3>Spell damage modifiers</h3>${a.detailSourceUrl?`<p class="modifier-source">Source: <a href="${esc(/^https:\/\/(?:foreverdb\.net|www\.wowhead\.com)\//.test(a.detailSourceUrl)?a.detailSourceUrl:'https://foreverdb.net')}" target="_blank" rel="noreferrer">${esc(a.detailSourceVersion||'Database reference')} ↗</a></p>`:''}<div class="effect-row">${esc(a.damageModifiers||(a.detailStatus==='unavailable'?'Not imported — the reference page could not be retrieved.':'No damage modifiers listed in the reference.'))}</div><h3>Effects</h3>${a.effects.trim() ? a.effects.split('\n').filter(Boolean).map((e,i)=>`<div class="effect-row"><span class="muted">EFFECT #${i+1}</span> &nbsp; ${esc(e)}</div>`).join('') : '<div class="effect-row muted">No structured effects yet. Add them in Design mode.</div>'}<div class="ability-source">${a.source ? `Started from a <a href="${esc(safeSource(a.source.url))}" target="_blank" rel="noreferrer">Wowhead reference ↗</a>. Your copy can be rewritten independently.` : 'Custom ability draft. All details are editable.'}</div></article>`;
    renderInspector();if(list)list.scrollTop=listTop;window.scrollTo(pageX,pageY);
  }
  function renderAbilities() {
    const c = current();
    if (!c.abilities.length) {
      $('canvas').innerHTML = `<div class="abilities-top"><h2>Class abilities</h2><button class="gold" data-action="add-ability">＋ Add ability</button></div><div class="empty-state">This class has no abilities yet.<button class="secondary" data-action="open-library">Browse reference abilities</button></div>`; return;
    }
    if (selection?.kind !== 'ability' || !selected()) selection = {kind:'ability',id:c.abilities[0].id};
    const a = selected().item;
    $('canvas').innerHTML = `<div class="abilities-top"><h2>The ${esc(c.name)} spellbook</h2><button class="gold" data-action="add-ability">＋ Add ability</button></div><label class="ability-search">Search class abilities<input id="ability-search" aria-label="Search class abilities" placeholder="Ability name, spell ID, rank, or level…" value="${esc(abilityQuery)}"></label><div class="abilities-list" id="ability-results" tabindex="0" role="region" aria-label="Class abilities list">${abilityCards()}</div><article class="ability-detail"><h2><img src="${esc(a.icon)}" alt="">${esc(a.name)}</h2>${preview(a)}<h3>Spell Details</h3><div class="spell-details-table">${[['Range',a.range],['Cast time',a.castTime],['Resource cost',a.cost],['Cooldown',a.cooldown],['Type',a.type],['School',a.school]].map(([label,value])=>`<div><span>${label}</span><p>${esc(value)}</p></div>`).join('')}</div><h3>Spell damage modifiers</h3>${a.detailSourceUrl?`<p class="modifier-source">Source: <a href="${esc(/^https:\/\/(?:foreverdb\.net|www\.wowhead\.com)\//.test(a.detailSourceUrl)?a.detailSourceUrl:'https://foreverdb.net')}" target="_blank" rel="noreferrer">${esc(a.detailSourceVersion||'Database reference')} ↗</a></p>`:''}<div class="effect-row">${esc(a.damageModifiers||(a.detailStatus==='unavailable'?'Not imported — the reference page could not be retrieved.':'No damage modifiers listed in the reference.'))}</div><h3>Effects</h3>${a.effects.trim() ? a.effects.split('\n').filter(Boolean).map((e,i)=>`<div class="effect-row"><span class="muted">EFFECT #${i+1}</span> &nbsp; ${esc(e)}</div>`).join('') : '<div class="effect-row muted">No structured effects yet. Add them in Design mode.</div>'}<div class="ability-source">${a.source ? `Started from a <a href="${esc(safeSource(a.source.url))}" target="_blank" rel="noreferrer">Wowhead reference ↗</a>. Your copy can be rewritten independently.` : 'Custom ability draft. All details are editable.'}</div></article>`;
  }
  function safeSource(url) { return /^https:\/\/(?:www\.|nether\.)?wowhead\.com\//.test(url || '') ? url : 'https://www.wowhead.com/'; }
  function renderLibrary() {
    const c = current(), needle = libraryQuery.toLowerCase();
    const list = allEntries.filter(e=>(c.sourceSlug ? e.classSlug === c.sourceSlug : true) && (libraryKind==='All'||e.kind===libraryKind) && (!needle||e.name.toLowerCase().includes(needle)||String(e.id).includes(needle)));
    const pageSize=20, pages=Math.max(1,Math.ceil(list.length/pageSize)); libraryPage=Math.min(libraryPage,pages-1);
    const results=list.slice(libraryPage*pageSize,(libraryPage+1)*pageSize);
    $('canvas').innerHTML = `<div class="library-heading"><div><h2>Reference library</h2><p class="library-summary">${esc(c.sourceSlug ? references.find(r=>r.slug===c.sourceSlug)?.name || c.name : 'All classes')} · ${list.length} entries · ${esc(c.sourceSlug ? references.find(r=>r.slug===c.sourceSlug)?.gameVersion || "Wowhead reference" : "Mixed reference editions")}</p></div><button class="secondary" data-action="download-catalog">Download data ↧</button></div><div class="library-filters"><input class="library-search" id="library-search" aria-label="Search reference abilities and talents" placeholder="Search abilities, talents, or spell IDs…" value="${esc(libraryQuery)}"><select id="library-kind" aria-label="Reference type">${['All','Ability','Talent','PvP talent'].map(k=>`<option ${k===libraryKind?'selected':''}>${k}</option>`).join('')}</select></div><div class="source-callout">Reference entries preserve Wowhead spell IDs and original descriptions. Adding an entry creates an editable copy in your classic design.</div><div id="library-results">${results.map(e=>`<div class="library-result"><img src="${esc(e.icon)}" alt=""><div class="result-title"><strong>${esc(e.name)}</strong><small>${esc(e.kind)} · Spell ${e.id}${e.passive?' · Passive':''}</small></div><button data-action="reference-preview" data-reference="${e.id}" data-slug="${esc(e.classSlug)}" aria-label="Preview ${esc(e.name)}">Preview</button><button data-action="reference-add" data-reference="${e.id}" data-slug="${esc(e.classSlug)}" aria-label="Add ${esc(e.name)} to class">＋ Add</button></div>`).join('')||'<div class="empty-state">No matching reference entries.</div>'}</div><div class="library-pagination"><button data-action="library-prev" ${libraryPage===0?'disabled':''}>←</button><span>Page ${libraryPage+1} of ${pages}</span><button data-action="library-next" ${libraryPage+1===pages?'disabled':''}>→</button></div>`;
  }
  function dialog(title, body) {
    $('dialog-content').innerHTML = `<div class="dialog-header"><h2 id="dialog-title">${esc(title)}</h2><button class="quiet" data-action="close-dialog" aria-label="Close dialog">✕</button></div>${body}`;
    if (!$('editor-dialog').open) $('editor-dialog').showModal();
  }
  function closeDialog() { $('editor-dialog').close(); }
  function classDialog(create=false) {
    const c = create ? {name:'New class',description:'',pointBudget:51,pointsPerTier:5,startLevel:10,levelCap:60,color:'#b59b73',icon:'assets/wowhead/class_deathknight.jpg',sourceSlug:''} : current();
    dialog(create?'Create a class':'Class settings',`<form id="class-edit" class="dialog-form" data-create="${create}">${field('Class name','name',c.name,'text','maxlength="80" required')}<label>Class description<textarea name="description" maxlength="2000">${esc(c.description)}</textarea></label><div class="field-row">${field('Class color','color',c.color,'color')}${selectField('Class icon','icon',c.icon,[['assets/wowhead/class_deathknight.jpg','Death Knight'],['assets/wowhead/class_demonhunter.jpg','Demon Hunter'],['assets/wowhead/class_monk.jpg','Monk'],...(window.WOW_FOREVER_CLASSES||[]).map(k=>[k.icon,k.name]),...(seeds.some(s=>'assets/wowhead/'+s.icon+'.jpg'===c.icon)?[]:[[c.icon,'Current icon']])])}</div><div class="field-row">${field('Talent point budget','pointBudget',c.pointBudget,'number','min="0" max="200" required')}${field('Points per tier','pointsPerTier',c.pointsPerTier,'number','min="0" max="20" required')}</div><div class="field-row">${field('First talent level','startLevel',c.startLevel,'number','min="1" max="90" required')}${field('Level cap','levelCap',c.levelCap,'number','min="1" max="100" required')}</div>${selectField('Reference library','sourceSlug',c.sourceSlug,[['','All classes'],...references.map(r=>[r.slug,r.name])])}<p class="help">Rule changes refund any ranks that become invalid. Undo restores the previous build.</p><div class="dialog-footer">${create?'':'<button class="secondary" type="button" data-action="duplicate-class">Duplicate class</button>'}<button type="button" class="secondary" data-action="close-dialog">Cancel</button><button class="gold" type="submit">${create?'Create class':'Save settings'}</button></div></form>`);
  }
  function treeDialog(id) {
    const tree=current().trees.find(t=>t.id===id); if(!tree)return;
    dialog('Edit talent tree',`<form id="tree-edit" class="dialog-form" data-tree="${esc(id)}">${field('Tree name','name',tree.name,'text','maxlength="60" required')}${selectField('Panel artwork','background',tree.background,[...artOptions,...(!artOptions.some(([path])=>path===tree.background)?[[tree.background,'Uploaded artwork']]:[])])}<div class="artwork-preview" id="artwork-preview" data-classic-artwork="${esc(artworkUrl(tree.background))}" style="background-image:linear-gradient(#0002,#0005),var(--classic-artwork,url('${esc(artworkUrl(tree.background))}'))" role="img" aria-label="Selected talent panel artwork"></div><div><p class="tiny-label">SPEC ARTWORK</p><div class="artwork-gallery">${specArtwork.map(a=>`<button type="button" class="artwork-choice" data-action="choose-background" data-background="${esc(a.path)}" aria-label="Choose ${esc(a.label)} artwork" aria-pressed="${a.path===tree.background}"><img data-classic-artwork="${esc(artworkUrl(a.path))}" src="${esc(artworkUrl(a.path))}" alt="" loading="lazy"><span>${esc(a.label)}</span></button>`).join('')}</div></div><button type="button" class="secondary" data-action="upload-background" data-tree="${esc(id)}">Upload background artwork</button><p class="help">Original generated scenery for all nine specs. Select any scene, then Apply tree settings. You can also upload a PNG, JPEG, or WebP under 2 MB.</p><div class="dialog-footer"><button type="button" class="secondary" data-action="close-dialog">Cancel</button><button class="gold" type="submit">Apply tree settings</button></div></form>`);
  }
  function previewTreeArtwork() {
    const form=$('tree-edit');if(!form)return;
    const path=form.elements.background.value;
    $('artwork-preview').style.removeProperty('--classic-artwork');
    $('artwork-preview').dataset.classicArtwork=artworkUrl(path);
    $('artwork-preview').style.backgroundImage=`linear-gradient(#0002,#0005),var(--classic-artwork,url('${artworkUrl(path)}'))`;
    form.querySelectorAll('.artwork-choice').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.background===path)));
  }
  function newTalent(tree,row,col,reference=null) {
    return {id:uid('talent'),name:reference?.name || 'New talent',icon:reference?.icon || tree.icon,
      description:reference?.description || 'Increases effectiveness by {value}%.',rankDescriptions:Array.isArray(reference?.rankDescriptions)?C.clone(reference.rankDescriptions):[],valuePerRank:2,
      row,col,maxRanks:Math.max(1,Math.min(10,reference?.maxRanks || 5)),requiredPoints:null,prerequisite:'',
      type:reference?reference.passive?'Passive':'Active':'Passive',school:reference?.school||'Unspecified',source:source(reference)};
  }
  function newAbility(reference=null) {
    if(reference)return Library.abilityFromReference(reference,uid('ability'));
    return {id:uid('ability'),name:reference?.name || 'New ability',icon:reference?.icon || current().icon,
      description:reference?.description || 'Describe what this class ability does.',type:reference?.passive?'Passive':'Active',
      level:Math.min(100,reference?.minLevel || 10),cost:reference?.cost || 'None',castTime:reference?.castTime || 'Instant',
      cooldown:reference?.cooldown || 'None',range:reference?.range || 'Self',school:'Unspecified',effects:'',source:source(reference)};
  }
  function addAbility(reference=null) {
    if(current().abilities.length>=300){toast('This class already has 300 abilities.');return;}
    const ability=newAbility(reference); const added=mutate(()=>{current().abilities.push(ability);view='abilities';mode='design';selection={kind:'ability',id:ability.id};});return added!==false;
  }
  function referenceDialog(entry) {
    dialog(entry.name,`<div class="dialog-form"><div class="selected-title"><img src="${esc(entry.icon)}" alt=""><div><h2>${esc(entry.name)}</h2><small>${esc(entry.className)} · ${esc(entry.kind)} · Spell ${entry.id}</small></div></div><div class="spell-preview"><div class="spell-name">${esc(entry.name)}</div><div>${esc(entry.castTime || (entry.passive?'Passive':'Reference spell'))}${entry.cooldown?' · '+esc(entry.cooldown):''}</div><div>${esc(entry.cost || '')}${entry.range?' · '+esc(entry.range):''}</div><p class="spell-description">${esc(entry.description || 'This catalog entry has no spell description. Its spell ID and icon are available for your rewrite.')}</p></div><p class="help">${esc(entry.gameVersion || "Wowhead reference")}. Tooltip may include specialization alternatives. Your classic copy can have different rules.</p><a href="${esc(entry.sourceUrl)}" target="_blank" rel="noreferrer">View spell on Wowhead ↗</a><div class="dialog-footer"><button class="secondary" data-action="close-dialog">Close</button><button class="gold" data-action="reference-add" data-reference="${entry.id}" data-slug="${esc(entry.classSlug)}">＋ Add to class</button></div></div>`);
  }
  function addReferenceDialog(entry) {
    dialog('Add reference to your design',`<form id="reference-import" class="dialog-form" data-reference="${entry.id}" data-slug="${esc(entry.classSlug)}"><div class="selected-title"><img src="${esc(entry.icon)}" alt=""><h2>${esc(entry.name)}</h2></div>${selectField('Add as','destination',entry.kind==='Ability'?'ability':'talent',[['ability','Class ability'],['talent','Talent']])}${selectField('Talent tree','tree',current().trees[0].id,current().trees.map(t=>[t.id,t.name]))}<p class="help">A talent uses the first empty slot in the selected tree. Spell data is copied; the reference stays intact.</p><div class="dialog-footer"><button type="button" class="secondary" data-action="close-dialog">Cancel</button><button class="gold" type="submit">Add editable copy</button></div></form>`);
  }
  let iconQuery='',iconPage=0,iconCategory='All icons',iconEntries=[],iconCatalogPromise=null;
  async function loadIconCatalog(){
    if(!window.WOW_ICON_CATALOG){
      if(!iconCatalogPromise)iconCatalogPromise=new Promise((resolve,reject)=>{
        const script=document.createElement('script');script.src='icon-catalog.js?v=20261011-4';script.onload=resolve;script.onerror=()=>reject(new Error('The full icon catalog could not be loaded.'));document.head.append(script);
      }).catch(error=>{iconCatalogPromise=null;throw error;});
      await iconCatalogPromise;
    }
    if(!iconEntries.length){const aliases={};for(const e of allEntries)(aliases[e.iconName]||= []).push(e.name);iconEntries=Library.iconEntries(window.WOW_ICON_CATALOG,aliases);}
  }
  async function iconsDialog(){
    iconQuery='';iconPage=0;iconCategory='All icons';
    dialog('Choose a WoW icon',`<div class="dialog-form"><div class="icon-filters"><input id="icon-search" class="library-search" aria-label="Search icons" placeholder="Search any WoW icon, spell name, or icon ID…"><select id="icon-category" aria-label="Icon category">${['All icons','Abilities','Spells','Items & professions','Achievements','Classes & races','Other'].map(c=>`<option>${esc(c)}</option>`).join('')}</select></div><div id="icon-summary" class="help" role="status">Loading the full WoW icon library…</div><div class="all-icon-options" id="icon-results"></div><div class="library-pagination" id="icon-pagination"></div><p class="help">All available downloaded WoW icons, across every class and expansion. Your chosen icon is saved inside your project.</p></div>`);
    try{await loadIconCatalog();if($('icon-results'))renderIconResults();}catch(error){if($('icon-summary'))$('icon-summary').textContent=error.message;}
  }
  function renderIconResults(){
    if(!$('icon-results'))return;
    const found=Library.findIcons(iconEntries,iconQuery,iconCategory),size=64,pages=Math.max(1,Math.ceil(found.length/size));iconPage=Math.min(iconPage,pages-1);
    const list=found.slice(iconPage*size,(iconPage+1)*size);
    $('icon-results').scrollTop=0;
    $('icon-summary').textContent=`${found.length.toLocaleString()} matches · ${iconEntries.length.toLocaleString()} icons in the full library`;
    $('icon-results').innerHTML=list.map(e=>`<button class="catalog-icon" data-action="set-catalog-icon" data-icon-name="${esc(e.name)}" aria-label="Use ${esc(e.name)} icon" title="${esc(e.name)} · ${e.id}"><span class="icon-crop"><img src="${Library.sheetPath(e)}" alt="" loading="lazy" width="512" height="512" style="left:${-(e.slot%8)*64}px;top:${-Math.floor(e.slot/8)*64}px"></span><small>${esc(e.name.replace(/_/g,' '))}</small></button>`).join('')||'<p>No matching icons. Try fewer words or a different category.</p>';
    $('icon-pagination').innerHTML=`<button data-action="icon-prev" aria-label="Previous icon page" ${iconPage===0?'disabled':''}>←</button><span>Page ${iconPage+1} of ${pages}</span><button data-action="icon-next" aria-label="Next icon page" ${iconPage+1===pages?'disabled':''}>→</button>`;
  }
  function stageIcon(image){
    const form=$('item-edit'),found=selected();if(!found)return;
    if(form){form.elements.icon.value=image;form.querySelector('.icon-field img').src=image;$('live-preview').innerHTML=preview(readItemForm(form,found.item,found.tree),!!found.tree,found.tree);toast('Icon selected. Apply changes to save it.');}
    else mutate(()=>{found.item.icon=image;});
    closeDialog();
  }
  const atlasImages=new Map();let iconSelectionToken=0;
  async function selectCatalogIcon(button){
    const e=iconEntries.find(e=>e.name===button.dataset.iconName);if(!e)return;
    const token=++iconSelectionToken,targetId=selection?.id;
    button.disabled=true;
    try{
      const path=Library.sheetPath(e);
      if(!atlasImages.has(path))atlasImages.set(path,new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>{atlasImages.delete(path);reject(new Error('The icon image could not be loaded.'));};img.src=path;}));
      const image=await atlasImages.get(path);if(token!==iconSelectionToken||selection?.id!==targetId||!$('icon-results'))return;
      const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
      canvas.getContext('2d').drawImage(image,e.slot%8*64,Math.floor(e.slot/8)*64,64,64,0,0,64,64);
      stageIcon(canvas.toDataURL('image/png'));
    }catch(error){toast(error.message);button.disabled=false;}
  }
  let templateQuery='',templateClass='',templatePage=0,templateSelected=null,templateCreates=true;
  function abilityTemplatesDialog(create){
    templateCreates=create;templateClass=current().sourceSlug||'';templatePage=0;
    const draftName=create?'':$('item-edit')?.elements.name.value||'';templateQuery=draftName==='New ability'?'':draftName;
    templateSelected=null;
    dialog(create?'Add a class ability':'Start from a WoW ability',`<div class="dialog-form"><p>Choose a WoW spell as a starting point, then rewrite its details for your class.</p><div class="icon-filters"><input id="template-search" aria-label="Search ability templates" class="library-search" placeholder="Try Demon Bite, Death Grip, or a spell ID…" value="${esc(templateQuery)}"><select id="template-class" aria-label="Template class"><option value="">All classes</option>${references.map(r=>`<option value="${esc(r.slug)}" ${r.slug===templateClass?'selected':''}>${esc(r.name)}</option>`).join('')}</select></div><div class="template-layout"><div><div id="template-results"></div><div id="template-pagination" class="library-pagination"></div></div><div id="template-preview"></div></div><div class="dialog-footer">${create?'<button class="secondary" data-action="blank-ability">Create a blank ability</button>':'<button class="secondary" data-action="close-dialog">Cancel</button>'}<button id="use-template" class="gold" data-action="use-ability-template" disabled>${create?'Add editable copy':'Load template into editor'}</button></div></div>`);
    renderTemplateResults();
  }
  function renderTemplateResults(){
    const found=allEntries.filter(e=>(!templateClass||e.classSlug===templateClass)&&Library.matches(e.name+' '+e.id,templateQuery)),size=12,pages=Math.max(1,Math.ceil(found.length/size));templatePage=Math.min(templatePage,pages-1);
    const list=found.slice(templatePage*size,(templatePage+1)*size);
    if(!templateSelected&&list.length)templateSelected=list[0];
    $('template-results').innerHTML=list.map(e=>`<button class="template-result ${templateSelected?.id===e.id?'active':''}" data-action="template-preview" data-reference="${e.id}" data-slug="${esc(e.classSlug)}"><img src="${esc(e.icon)}" alt=""><span><strong>${esc(e.name)}</strong><small>${esc(e.className)} · ${esc(e.kind)} · ${e.id}</small></span></button>`).join('')||'<p class="help">No matching references. Try another class or fewer words.</p>';
    $('template-pagination').innerHTML=`<button data-action="template-prev" aria-label="Previous template page" ${templatePage===0?'disabled':''}>←</button><span>${found.length} spells · ${templatePage+1}/${pages}</span><button data-action="template-next" aria-label="Next template page" ${templatePage+1===pages?'disabled':''}>→</button>`;
    renderTemplatePreview();
  }
  function renderTemplatePreview(){
    const e=templateSelected;$('use-template').disabled=!e;
    if(!e){$('template-preview').innerHTML='<p class="help">Select a spell to preview it.</p>';return;}
    const ability=Library.abilityFromReference(e,'template-preview');
    $('template-preview').innerHTML=`<div class="selected-title"><img src="${esc(ability.icon)}" alt=""><h3>${esc(ability.name)}</h3></div>${preview(ability)}<dl class="details-grid"><div><dt>School</dt><dd>${esc(ability.school)}</dd></div><div><dt>Cooldown</dt><dd>${esc(ability.cooldown)}</dd></div></dl><p class="help">Reference baseline. Loading it fills the name, icon, type, level, cost, range, cast time, cooldown, school, description, and available effects. Your copy is fully editable.</p><a href="${esc(safeSource(e.sourceUrl))}" target="_blank" rel="noreferrer">Original spell on Wowhead ↗</a>`;
  }
  function useAbilityTemplate(){
    if(!templateSelected)return;
    const e=templateSelected;
    if(templateCreates){closeDialog();if(addAbility(e))toast('WoW baseline added. Rewrite any field to suit your class.');return;}
    const form=$('item-edit'),found=selected();if(!form||!found||found.tree)return;
    const ability=Library.abilityFromReference(e,found.item.id);
    for(const key of ['name','icon','type','level','cost','range','castTime','cooldown','school','description','effects'])form.elements[key].value=ability[key];
    form.dataset.templateSource=JSON.stringify(ability.source);form.querySelector('.icon-field img').src=ability.icon;
    $('live-preview').innerHTML=preview(ability);closeDialog();toast('Baseline loaded. Edit it, then Apply changes to save.');
  }
  let imageTarget=null;
  function upload(target) {imageTarget=target;$('image-file').value='';$('image-file').click();}
  $('image-file').addEventListener('change',async event=>{
    const file=event.target.files[0]; if(!file)return;
    const target=imageTarget; const max=target.type==='background'?2*1024*1024:1024*1024;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>max){toast(`Choose a PNG, JPEG, or WebP under ${max/1024/1024} MB.`);return;}
    const reader=new FileReader(); reader.onload=()=>{
      const image=String(reader.result);if(!C.safeImage(image)){toast('This image cannot be stored in the project.');return;}
      if(target.type==='background'){
        const form=$('tree-edit');if(form){const select=form.elements.background;const opt=new Option('Uploaded artwork',image,true,true);select.add(opt);previewTreeArtwork();toast('Artwork loaded. Apply tree settings to save.');}
      }else{
        stageIcon(image);
      }
    }; reader.readAsDataURL(file);
  });
  function readItemForm(form, original, tree) {
    const fd=new FormData(form), item=C.clone(original);
    for(const key of ['name','description','type','school','damageModifiers'])item[key]=String(fd.get(key)||'').trim();
    item.icon=String(fd.get('icon')||original.icon);
    if(form.dataset.templateSource)item.source=JSON.parse(form.dataset.templateSource);
    if(tree){
      for(const key of ['maxRanks','row','col','valuePerRank'])item[key]=Number(fd.get(key));
      item.requiredPoints=String(fd.get('requiredPoints')).trim()===''?null:Number(fd.get('requiredPoints'));
      item.prerequisite=String(fd.get('prerequisite')||'');item.rankDescriptions=String(fd.get('rankDescriptions')||'').split('\n').map(v=>v.trim());
      item.arrow={route:String(fd.get('arrowRoute')||'auto'),startEdge:'auto',endEdge:'auto',offset:Number(fd.get('arrowOffset')||0),bend:Number(fd.get('arrowBend')||0)};
      if(item.rankDescriptions.length===1&&!item.rankDescriptions[0])item.rankDescriptions=[];
    }else{
      item.level=Number(fd.get('level'));for(const key of ['cost','castTime','cooldown','range','effects','damageModifiers'])item[key]=String(fd.get(key)||'').trim();
    }
    return item;
  }
  function exportDownload(value,name) {
    const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('JSON export downloaded. Keep it as a backup of your design.');
  }
  function slug(name){return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'class';}
  function calculatorSnapshot() { return Share.snapshot(project,current().id,shareScope,playMode||shareIncludeRanks); }
  async function shareCalculator() {
    dialog(playMode?'Share your build':'Share design', '<div class="dialog-form"><p>Preparing your calculator…</p></div>');
    let link='',message='';
    try {
      if(location.protocol==='file:')throw new Error('This is a standalone calculator file. Send this file to share it.');
      const snapshot=calculatorSnapshot();
      if(shareScope==='current')link=await Share.publishedLink(snapshot,current().id,playMode||shareIncludeRanks);
      if(link)message='Compact build link · Uses the published class and saves your friend’s points separately.';
      else{const encoded=await Share.encode(snapshot);const url=new URL(Share.siteUrl());url.search='?play=1&share=2';url.hash='project='+encoded;link=url.href;}
    }catch(error){message=error.message;}
    if(!$('editor-dialog').open)return;
    dialog(playMode?'Share your build':'Share design',`<div class="dialog-form"><p>${playMode||shareIncludeRanks?'Share your current points and the complete class design.':'Share a preview of your class designs and abilities. Your recipient’s existing local creations stay untouched.'} Shared previews save their points separately from personal builds and designs.</p>${selectField("Classes to share","share-scope",shareScope,[["current",current().name+" only"],["all","All classes (file export for large projects)"]])}${!playMode?`<label class="share-rank-option"><input type="checkbox" name="share-ranks" ${shareIncludeRanks?'checked':''}> Include current talent points</label>`:''}${link?`<label>Design preview link<input id="calculator-link" aria-label="Design preview link" readonly value="${esc(link)}"></label><button class="gold" data-action="copy-calculator-link">Copy link</button>`:''}<p class="help">${esc(message||'No sign-in required. A link captures this version of your design; share a new link after editing it.')}</p>${location.protocol==='file:'?'':`<div class="share-download"><h3>Standalone calculator</h3><p>Includes the selected classes, abilities, and artwork in one HTML file. Friends can open it in a browser without hosting or sign-in. Anyone you send the file to can use it.</p><button class="secondary" data-action="download-calculator">Download calculator file</button></div>`}</div>`);
  }
  async function downloadCalculator(button) {
    button.disabled=true;button.textContent='Bundling artwork…';
    try {
      const html=await Share.standalone(calculatorSnapshot());
      const url=URL.createObjectURL(new Blob([html],{type:'text/html'})),a=document.createElement('a');
      a.href=url;a.download='wow-forever-class-designer-calculator.html';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      toast('Calculator downloaded. Send the HTML file to your friends.');
    }catch(error){toast('Export failed: '+error.message);}
    finally{button.disabled=false;button.textContent='Download calculator file';}
  }
  function handleAction(button) {
    const action=button.dataset.action, c=current(), found=selected();
    if(playMode && !['rank-plus','rank-minus','reset-all','reset-tree','close-dialog','copy-calculator-link','download-calculator'].includes(action))return;
    switch(action){
      case 'copy-calculator-link': {
        const field=$('calculator-link');
        navigator.clipboard.writeText(field.value).then(()=>toast('Calculator link copied.')).catch(()=>{field.focus();field.select();toast('Select and copy the calculator link.');});break;
      }
      case 'download-calculator':downloadCalculator(button);break;
      case 'enter-design': mode='design';render();break;
      case 'rank-plus': case 'rank-minus': if(found?.tree){let result;mutate(()=>{result=C.allocate(c,found.tree,found.item,action==='rank-plus'?1:-1);});if(!result.ok)toast(result.message);}break;
      case 'reset-all':mutate(()=>{c.ranks={};});toast('Build reset. Undo restores your points.');break;
      case 'reset-tree':mutate(()=>{const tree=c.trees.find(t=>t.id===button.dataset.tree);tree.talents.forEach(t=>{c.ranks[t.id]=0;});});break;
      case 'tree-settings':treeDialog(button.dataset.tree);break;
      case 'choose-background':if($('tree-edit')){$('tree-edit').elements.background.value=button.dataset.background;previewTreeArtwork();}break;
      case 'add-talent':{const tree=c.trees.find(t=>t.id===button.dataset.tree),talent=newTalent(tree,Number(button.dataset.row),Number(button.dataset.col));mutate(()=>{tree.talents.push(talent);selection={kind:'talent',id:talent.id};});toast('Talent added. Edit its name, ranks, and effects.');break;}
      case 'add-ability':abilityTemplatesDialog(true);break;
      case 'ability-template':abilityTemplatesDialog(false);break;
      case 'blank-ability':closeDialog();addAbility();break;
      case 'template-preview':templateSelected=allEntries.find(e=>String(e.id)===button.dataset.reference&&e.classSlug===button.dataset.slug);renderTemplateResults();break;
      case 'use-ability-template':useAbilityTemplate();break;
      case 'template-prev':templatePage=Math.max(0,templatePage-1);renderTemplateResults();break;
      case 'template-next':templatePage++;renderTemplateResults();break;
      case 'pick-icon':iconsDialog();break;
      case 'set-icon':stageIcon(button.dataset.icon);break;
      case 'set-catalog-icon':selectCatalogIcon(button);break;
      case 'icon-prev':iconPage=Math.max(0,iconPage-1);renderIconResults();break;
      case 'icon-next':iconPage++;renderIconResults();break;
      case 'upload-icon':upload({type:'icon'});break;
      case 'upload-background':upload({type:'background',id:button.dataset.tree});break;
      case 'delete-item':if(found){mutate(()=>{if(found.tree){found.tree.talents=found.tree.talents.filter(t=>t.id!==found.item.id);found.tree.talents.forEach(t=>{if(t.prerequisite===found.item.id)t.prerequisite='';});C.normalizeRanks(c);}else{c.abilities=c.abilities.filter(a=>a.id!==found.item.id);}selectDefault();});toast('Removed. Undo is available.');}break;
      case 'close-dialog':closeDialog();break;
      case 'duplicate-class':{
        if(project.classes.length>=50){toast('A project can contain at most 50 classes.');break;}
        const copy=C.clone(c);copy.id=uid('class');copy.name=(copy.name+' copy').slice(0,80);mutate(()=>{project.classes.push(copy);activeId=copy.id;selectDefault();});closeDialog();toast('Class duplicated.');break;}
      case 'open-library':view='library';selection=null;libraryPage=0;libraryQuery='';render();break;
      case 'library-prev':libraryPage=Math.max(0,libraryPage-1);renderLibrary();break;
      case 'library-next':libraryPage++;renderLibrary();break;
      case 'reference-preview':{const entry=allEntries.find(e=>String(e.id)===button.dataset.reference&&e.classSlug===button.dataset.slug);if(entry)referenceDialog(entry);break;}
      case 'reference-add':{const entry=allEntries.find(e=>String(e.id)===button.dataset.reference&&e.classSlug===button.dataset.slug);if(entry)addReferenceDialog(entry);break;}
      case 'download-catalog':{const catalog=references.find(r=>r.slug===c.sourceSlug);exportDownload(catalog||references,`${c.sourceSlug||'all-classes'}-wowhead-reference.json`);break;}
    }
  }
  document.addEventListener('click',event=>{
    const classButton=event.target.closest('[data-class-id]');if(classButton){activeId=classButton.dataset.classId;libraryPage=0;abilityQuery="";selectDefault();render();return;}
    const talentButton=event.target.closest('[data-talent-id]');if(talentButton){
      const c=current(),tree=c.trees.find(t=>t.id===talentButton.dataset.tree),t=tree.talents.find(t=>t.id===talentButton.dataset.talentId);
      selection={kind:'talent',id:t.id};
      if(mode==='build'){let result;mutate(()=>{result=C.allocate(c,tree,t,1);});if(!result.ok){render();toast(result.message);}else render();}else render();return;
    }
    const abilityButton=event.target.closest('[data-ability-id]');if(abilityButton){selectAbility(abilityButton.dataset.abilityId);return;}
    const actionButton=event.target.closest('[data-action]');if(actionButton){handleAction(actionButton);return;}
  });
  document.addEventListener('contextmenu',event=>{
    const node=event.target.closest('[data-talent-id]');if(!node)return;event.preventDefault();
    const c=current(),tree=c.trees.find(t=>t.id===node.dataset.tree),t=tree.talents.find(t=>t.id===node.dataset.talentId);selection={kind:'talent',id:t.id};
    if(mode==='build'){let result;mutate(()=>{result=C.allocate(c,tree,t,-1);});if(!result.ok){render();toast(result.message);}else render();}else render();
  });
  function tooltipFor(node) {
    const c=current(),tree=c.trees.find(t=>t.id===node.dataset.tree),t=tree?.talents.find(t=>t.id===node.dataset.talentId);if(!t)return;
    const rank=c.ranks[t.id]||0, reason=C.unmet(c,tree,t);
    $('tooltip').innerHTML=`<div class="spell-name">${esc(t.name)}</div><div class="tip-meta">${esc(t.type)} · Rank ${rank}/${t.maxRanks}</div><div class="tip-meta">Requires ${esc(c.name)}</div><div class="desc">${esc(C.description(t,Math.max(1,rank)))}</div>${rank>0&&rank<t.maxRanks?`<div class="tooltip-next-rank"><div>Next rank:</div><div class="desc">${esc(C.description(t,rank+1))}</div></div>`:''}${reason?`<div class="requirements">${esc(reason)}</div>`:''}`;
    $('tooltip').hidden=false;
    const box=node.getBoundingClientRect(),tip=$('tooltip').getBoundingClientRect();
    let left=box.right+10;if(left+tip.width>innerWidth-10)left=Math.max(10,box.left-tip.width-10);
    let top=Math.min(Math.max(10,box.top),innerHeight-tip.height-10);$('tooltip').style.left=left+'px';$('tooltip').style.top=Math.max(10,top)+'px';
  }
  document.addEventListener('pointerover',event=>{const node=event.target.closest('[data-talent-id]');if(node&&event.pointerType!=='touch')tooltipFor(node);});
  document.addEventListener('pointerout',event=>{if(event.target.closest('[data-talent-id]'))$('tooltip').hidden=true;});
  document.addEventListener('focusin',event=>{const node=event.target.closest('[data-talent-id]');if(node)tooltipFor(node);});
  document.addEventListener('focusout',event=>{if(event.target.closest('[data-talent-id]'))$('tooltip').hidden=true;});
  document.addEventListener('input',event=>{
    if(event.target.id==='ability-search'){abilityQuery=event.target.value;$('ability-results').innerHTML=abilityCards();}
    else if(event.target.id==='library-search'){
      libraryQuery=event.target.value;libraryPage=0;const start=event.target.selectionStart;renderLibrary();$('library-search').focus();$('library-search').setSelectionRange(start,start);
    }else if(event.target.id==='icon-search'){iconQuery=event.target.value;iconPage=0;renderIconResults();}
    else if(event.target.id==='template-search'){templateQuery=event.target.value;templatePage=0;templateSelected=null;renderTemplateResults();}
    else if(event.target.closest('#item-edit')){
      const found=selected();if(!found)return;const draft=readItemForm($('item-edit'),found.item,found.tree);
      if(found.tree && event.target.name==='row') {
        const select=$('item-edit').elements.prerequisite;
        const choices=found.tree.talents.filter(t=>t.id!==draft.id && t.row<=draft.row);
        select.innerHTML='<option value="">None</option>'+choices.map(t=>`<option value="${esc(t.id)}" ${draft.prerequisite===t.id?'selected':''}>${esc(t.name)}</option>`).join('');
      }
      if(draft.description&&draft.maxRanks!==0)$('live-preview').innerHTML=preview(draft,!!found.tree,found.tree);
      if(found.tree){
        drawDependencyArrows(draft);
        const working={...found.tree,talents:found.tree.talents.map(t=>t.id===draft.id?draft:t)},clear=!draft.prerequisite||!!C.classicConnection(working,draft),status=$('arrow-route-status');
        if(status){status.textContent=!draft.prerequisite?'No prerequisite arrow.':clear?'Clear route — no occupied slots crossed.':'Blocked route. Choose another source/route or move the blocking talent.';status.classList.toggle('route-blocked',!clear);}
      }
    }
  });
  document.addEventListener('change',event=>{
    if(event.target.id==='library-kind'){libraryKind=event.target.value;libraryPage=0;renderLibrary();}
    if(event.target.id==='icon-category'){iconCategory=event.target.value;iconPage=0;renderIconResults();}
    if(event.target.id==='template-class'){templateClass=event.target.value;templatePage=0;templateSelected=null;renderTemplateResults();}
    if(event.target.name==='share-scope'){shareScope=event.target.value;shareCalculator();}
    if(event.target.name==='share-ranks'){shareIncludeRanks=event.target.checked;shareCalculator();}
    if(event.target.closest('#tree-edit')&&event.target.name==='background')previewTreeArtwork();
  });
  document.addEventListener('submit',event=>{
    const form=event.target;event.preventDefault();
    if(form.id==='item-edit'){
      const found=selected();if(!found)return;const draft=readItemForm(form,found.item,found.tree),test=C.clone(project),testC=test.classes.find(c=>c.id===activeId);
      if(found.tree){const tree=testC.trees.find(t=>t.id===found.tree.id);tree.talents[tree.talents.findIndex(t=>t.id===draft.id)]=draft;}else testC.abilities[testC.abilities.findIndex(a=>a.id===draft.id)]=draft;
      try{C.validateProject(test);C.validateArrowLayouts(test);}catch(error){toast(error.message);return;}
      const originalRanks=C.total(current());mutate(()=>{Object.assign(found.item,draft);C.normalizeRanks(current());});
      toast(C.total(current())<originalRanks?'Changes applied. Invalid ranks were refunded.':'Changes applied.');
    }else if(form.id==='class-edit'){
      const fd=new FormData(form),create=form.dataset.create==='true';
      const values={name:String(fd.get('name')).trim(),description:String(fd.get('description')).trim(),color:String(fd.get('color')),icon:String(fd.get('icon')),sourceSlug:String(fd.get('sourceSlug'))};
      for(const key of ['pointBudget','pointsPerTier','startLevel','levelCap'])values[key]=Number(fd.get(key));
      const test=C.clone(project);let draft;
      if(create){if(test.classes.length>=50){toast('A project can contain at most 50 classes.');return;}draft={id:uid('class'),...values,ranks:{},abilities:[],trees:art.map((background,i)=>({id:uid('tree'),name:['Discipline','Mastery','Legacy'][i],icon:values.icon,background,talents:[]}))};test.classes.push(draft);}
      else{draft=test.classes.find(c=>c.id===activeId);Object.assign(draft,values);}
      try{C.validateProject(test);}catch(error){toast(error.message);return;}
      mutate(()=>{if(create){project.classes.push(draft);activeId=draft.id;view='talents';mode='design';selectDefault();}else{Object.assign(current(),values);C.normalizeRanks(current());}});closeDialog();toast(create?'New class created. Rename its trees and add talents.':'Class settings saved.');
    }else if(form.id==='tree-edit'){
      const tree=current().trees.find(t=>t.id===form.dataset.tree),fd=new FormData(form),name=String(fd.get('name')).trim();
      if(!name){toast('Give the tree a name.');return;}
      mutate(()=>{tree.name=name;tree.background=String(fd.get('background'));});closeDialog();
    }else if(form.id==='reference-import'){
      const entry=allEntries.find(e=>String(e.id)===form.dataset.reference&&e.classSlug===form.dataset.slug),fd=new FormData(form);if(!entry)return;
      if(fd.get('destination')==='ability'){closeDialog();addAbility(entry);}
      else{
        const tree=current().trees.find(t=>t.id===fd.get('tree')),index=Array.from({length:28},(_,i)=>i).find(i=>!tree.talents.some(t=>t.row===Math.floor(i/4)&&t.col===i%4));
        if(index===undefined){toast('That tree is full. Remove a talent or choose another tree.');return;}
        const t=newTalent(tree,Math.floor(index/4),index%4,entry);mutate(()=>{tree.talents.push(t);view='talents';mode='design';selection={kind:'talent',id:t.id};});closeDialog();toast('Reference copied into your custom talent tree.');
      }
    }
  });
  $('tab-talents').addEventListener('click',()=>{view='talents';selectDefault();render();});
  $('tab-abilities').addEventListener('click',()=>{view='abilities';selectDefault();render();});
  $('mode-build').addEventListener('click',()=>{mode='build';render();});$('mode-design').addEventListener('click',()=>{if(!playMode){mode='design';render();}});
  $('class-settings').addEventListener('click',()=>{if(!playMode)classDialog();});$('add-class').addEventListener('click',()=>{if(!playMode)classDialog(true);});
  $('open-library').addEventListener('click',()=>{if(!playMode){view='library';selection=null;libraryPage=0;libraryQuery='';render();}});
  $('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);
  $('export-project').addEventListener('click',async()=>{try{exportDownload({...await Share.compact(project),exportedAt:new Date().toISOString()},'wow-forever-class-designer-project.json');}catch(error){toast('Export failed: '+error.message);}});
  $('share-calculator').addEventListener('click',shareCalculator);
  $('import-project').addEventListener('click',()=>{if(!playMode){$('import-file').value='';$('import-file').click();}});
  $('import-file').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    if(file.size>20*1024*1024){toast('Project files must be smaller than 20 MB.');return;}
    try{const imported=renameStarterMonkSpecs(C.validateProject(C.fixStarterArrows(JSON.parse(await file.text()))));Library.migrateStarterArtwork(imported);Library.mergeForeverClasses(imported,window.WOW_FOREVER_CLASSES||[]);mutate(()=>{project=imported;activeId=project.classes[0].id;view='talents';mode='build';selectDefault();});toast('Project imported. Undo restores your previous project.');}
    catch(error){toast('Import failed: '+error.message);}
  });
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'&&!event.target.matches('input,textarea,select')){event.preventDefault();event.shiftKey?redo():undo();}
    if(event.key==='Escape')$('tooltip').hidden=true;
  });
  document.addEventListener('error',event=>{if(event.target.tagName==='IMG'&&!event.target.src.endsWith('inv_misc_questionmark.jpg'))event.target.src=fallback;},true);
  $('editor-dialog').addEventListener('click',event=>{if(event.target===$('editor-dialog')){const r=$('editor-dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();}});
  new ResizeObserver(()=>drawDependencyArrows()).observe($('canvas'));
  if(playMode){
    document.body.classList.add('calculator-only');
    document.title='WoW Forever Class Designer — Shared Preview';
    document.querySelector('.header-section').textContent='Talent calculator';
    document.querySelector('.brand small').textContent='SHARED DESIGN PREVIEW';
    document.querySelector('.breadcrumb').firstChild.textContent='CALCULATOR ';
    document.querySelector('.content-footer span').innerHTML='<i class="status-dot"></i> Your points are saved on this device';
    $('save-status').textContent='Your build · Your device';
    $('share-calculator').textContent='Share build ↗';
    document.querySelector('.breadcrumb').insertAdjacentHTML('afterend','<p class="shared-notice">Shared design preview · Its points are saved separately. Your local creations stay untouched.</p>');
  }
  selectDefault();render();if(!playMode)save();if(restoreMessage)toast(restoreMessage);
})();
