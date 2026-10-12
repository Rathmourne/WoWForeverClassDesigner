(async function(){
'use strict';
const C=window.TalentForgeCore,B=window.TalentForgeBuild;
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let project;
try{const response=await fetch('project.json',{cache:'no-cache'});if(!response.ok)throw Error('Class data could not be loaded.');project=C.validateProject(await response.json());}
catch(error){$('canvas').textContent=error.message;return;}
let storageKey=B.storageKey(project,location.hash);
let activeId=project.classes[0].id,view='talents',selection=null,abilityQuery='',toastTimer;
const current=()=>project.classes.find(c=>c.id===activeId)||project.classes[0];
function selected(){const c=current();if(selection?.kind==='talent')for(const tree of c.trees){const item=tree.talents.find(t=>t.id===selection.id);if(item)return{item,tree};}if(selection?.kind==='ability'){const item=c.abilities.find(a=>a.id===selection.id);if(item)return{item};}return null;}
function selectDefault(){selection=view==='abilities'&&current().abilities[0]?{kind:'ability',id:current().abilities[0].id}:current().trees[0].talents[0]?{kind:'talent',id:current().trees[0].talents[0].id}:null;}
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5000);}
function save(){try{localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(project.classes.map(c=>[c.id,c.ranks]))));$('save-status').textContent='Your build is saved';}catch{$('save-status').textContent='Storage unavailable';}}
function loadBuild(hash){
  const copy=C.clone(project);for(const c of copy.classes)c.ranks={};
  const incoming=hash?B.apply(copy,hash):null,key=B.storageKey(copy,hash);
  try{const saved=JSON.parse(localStorage.getItem(key)||'{}');for(const c of copy.classes)if(saved[c.id])B.restore(c,saved[c.id]);}catch{toast('Saved builds could not be restored.');}
  project=copy;storageKey=key;if(incoming)activeId=incoming.id;
  $('shared-notice').hidden=!hash;if(hash)save();
}
try{loadBuild(location.hash);}catch(error){toast(error.message);}
function render(){const c=current();document.documentElement.style.setProperty('--class',c.color);$('tooltip').hidden=true;
$('class-list').innerHTML=project.classes.map(k=>`<button class="class-nav ${k.id===c.id?'active':''}" style="--nav-color:${esc(k.color)}" data-class-id="${esc(k.id)}" aria-pressed="${k.id===c.id}"><img src="${esc(k.icon)}" alt=""><div><span>${esc(k.name)}</span><small>${k.trees.map(t=>esc(t.name)).join(' · ')}</small></div></button>`).join('');
for(const id of ['class-name','breadcrumb-class'])$(id).textContent=c.name;$('class-description').textContent=c.description;$('class-icon').src=c.icon;$('ability-count').textContent=c.abilities.length;
for(const name of ['talents','abilities']){$('tab-'+name).classList.toggle('active',view===name);$('tab-'+name).setAttribute('aria-selected',view===name);} $('workspace').setAttribute('aria-labelledby','tab-'+view);
if(view==='talents')renderTalents();else renderAbilities();renderInspector();if(view==='talents')requestAnimationFrame(()=>drawDependencyArrows());}
function renderTalents(){const c=current(),spent=C.total(c),level=spent?Math.min(c.levelCap,c.startLevel+spent-1):c.startLevel-1;
const trees=c.trees.map(tree=>{const nodes=Array.from({length:28},(_,i)=>{const t=tree.talents.find(t=>t.row===Math.floor(i/4)&&t.col===i%4);if(!t)return '<div class="talent-cell"></div>';const rank=c.ranks[t.id]||0,locked=!!C.unmet(c,tree,t),state=rank===t.maxRanks?'maxed':rank?'allocated':locked?'locked':'available';return `<div class="talent-cell">${t.col===0?`<span class="tier-indicator" aria-hidden="true">${t.row?t.row*c.pointsPerTier:''}</span>`:''}<button class="talent-node ${state} ${selection?.id===t.id?'selected':''}" data-talent-id="${esc(t.id)}" data-tree="${esc(tree.id)}" aria-label="${esc(t.name)}, rank ${rank} of ${t.maxRanks}${locked?', locked':''}"><img src="${esc(t.icon)}" alt="" draggable="false"><span class="rank-badge">${rank}/${t.maxRanks}</span></button></div>`;}).join('');return `<section class="tree-panel" aria-label="${esc(tree.name)} talent tree"><div class="tree-title"><img src="${esc(tree.icon)}" alt=""><h2>${esc(tree.name)}</h2><span class="tree-points">${C.sum(tree,c.ranks)}</span><button class="quiet" data-action="reset-tree" data-tree="${esc(tree.id)}" aria-label="Reset ${esc(tree.name)}">↺</button></div><div class="tree-art" style="--tree-image:url('${esc(tree.background)}')"><svg class="arrows" aria-hidden="true"><defs><marker id="arrow-${esc(tree.id)}"></marker></defs></svg><div class="talent-grid">${nodes}</div></div><div class="tree-bottom"><span>${tree.talents.length} TALENTS</span><span>${C.sum(tree,c.ranks)} POINTS SPENT</span></div></section>`;}).join('');
$('canvas').innerHTML=`<div class="allocation-bar"><div class="allocation"><strong>${c.pointBudget-spent}</strong><span>points left</span></div><div class="level">POINTS SPENT <b>${spent} / ${c.pointBudget}</b><br>REQUIRED LEVEL <b>${level}</b></div><button class="secondary" data-action="reset-all">↺ Reset build</button></div><div class="tree-grid">${trees}</div><div class="canvas-legend"><span><i class="legend-dot available"></i>Available</span><span><i class="legend-dot maxed"></i>Maxed</span><span><i class="legend-dot"></i>Locked</span><span class="hint">Click +1 · Shift-click all ranks · Right-click −1</span></div>`;}
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

  function preview(item, talent = false, tree) {
    const c = current(), rank = talent ? c.ranks[item.id] || 0 : 1;
    const displayRank = Math.max(1, rank);
    return `<div class="spell-preview"><div class="spell-name">${esc(item.name)}</div>${talent ? `<div class="spell-meta"><span>${esc(item.type || 'Passive')}</span><span>Rank ${displayRank}/${item.maxRanks}</span></div><div>Requires ${esc(c.name)}</div>` : `<div class="spell-meta"><span>${esc(item.cost)}</span><span>${esc(item.range)}</span></div><div class="spell-meta"><span>${esc(item.type === 'Passive' ? 'Passive' : item.castTime)}</span><span>${esc(item.cooldown === 'None' ? '' : item.cooldown)}</span></div><div>Requires ${esc(c.name)} · Level ${item.level}</div>`}<p class="spell-description">${esc(talent ? C.description(item, displayRank) : item.description || (item.sourceMissingDescription ? 'Effect description is not yet provided by the Forever reference.' : ''))}</p>${talent && rank < item.maxRanks && rank > 0 ? `<div class="next-rank">Next rank:<p>${esc(C.description(item, rank + 1))}</p></div>` : ''}${talent && C.unmet(c, tree, item) ? `<p class="spell-requirement">${esc(C.unmet(c,tree,item))}</p>` : ''}</div>`;
  }

function renderInspector(){const found=selected();if(!found){$('inspector').innerHTML='<div class="inspector-header">SPELL PREVIEW</div><div class="empty-state">Select a talent or ability to see its details.</div>';return;}const{item,tree}=found;
$('inspector').innerHTML=`<div class="inspector-header">SPELL PREVIEW<span>${tree?'TALENT':'ABILITY'}</span></div><div class="inspector-body"><div class="selected-title"><img src="${esc(item.icon)}" alt=""><div><h2>${esc(item.name)}</h2><small>${tree?esc(tree.name)+' · Tier '+(item.row+1):esc(item.type)+' · Level '+item.level}</small></div></div>${preview(item,!!tree,tree)}${tree?`<div class="selection-controls"><span>Allocated ranks</span><div class="rank-controls"><button data-action="rank-minus" aria-label="Refund selected talent point">−</button><span>${current().ranks[item.id]||0} / ${item.maxRanks}</span><button data-action="rank-plus" aria-label="Allocate selected talent point">＋</button></div></div>`:''}<div class="inspector-label">Spell details</div><dl class="details-grid"><div><dt>School</dt><dd>${esc(item.school||'Unspecified')}</dd></div><div><dt>${tree?'Prerequisite':'Cooldown'}</dt><dd>${esc(tree?tree.talents.find(t=>t.id===item.prerequisite)?.name||'None':item.cooldown)}</dd></div></dl></div>`;}
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
    if(detail)detail.outerHTML=`<article class="ability-detail"><h2><img src="${esc(a.icon)}" alt="">${esc(a.name)}</h2>${preview(a)}<h3>Spell Details</h3><div class="spell-details-table">${[['Range',a.range],['Cast time',a.castTime],['Resource cost',a.cost],['Cooldown',a.cooldown],['Type',a.type],['School',a.school]].map(([label,value])=>`<div><span>${label}</span><p>${esc(value)}</p></div>`).join('')}</div><h3>Spell damage modifiers</h3>${a.detailSourceUrl?`<p class="modifier-source">Source: <a href="${esc(/^https:\/\/(?:foreverdb\.net|www\.wowhead\.com)\//.test(a.detailSourceUrl)?a.detailSourceUrl:'https://foreverdb.net')}" target="_blank" rel="noreferrer">${esc(a.detailSourceVersion||'Database reference')} ↗</a></p>`:''}<div class="effect-row">${esc(a.damageModifiers||(a.detailStatus==='unavailable'?'Not imported — the reference page could not be retrieved.':'No damage modifiers listed in the reference.'))}</div><h3>Effects</h3>${a.effects.trim() ? a.effects.split('\n').filter(Boolean).map((e,i)=>`<div class="effect-row"><span class="muted">EFFECT #${i+1}</span> &nbsp; ${esc(e)}</div>`).join('') : '<div class="effect-row muted">No additional structured effects provided.</div>'}</article>`;
    renderInspector();if(list)list.scrollTop=listTop;window.scrollTo(pageX,pageY);
  }
  function renderAbilities() {
    const c = current();
    if (!c.abilities.length) {
      $('canvas').innerHTML = `<div class="abilities-top"><h2>Class abilities</h2></div><div class="empty-state">This class has no abilities yet.</div>`; return;
    }
    if (selection?.kind !== 'ability' || !selected()) selection = {kind:'ability',id:c.abilities[0].id};
    const a = selected().item;
    $('canvas').innerHTML = `<div class="abilities-top"><h2>The ${esc(c.name)} spellbook</h2></div><label class="ability-search">Search class abilities<input id="ability-search" aria-label="Search class abilities" placeholder="Ability name, spell ID, rank, or level…" value="${esc(abilityQuery)}"></label><div class="abilities-list" id="ability-results" tabindex="0" role="region" aria-label="Class abilities list">${abilityCards()}</div><article class="ability-detail"><h2><img src="${esc(a.icon)}" alt="">${esc(a.name)}</h2>${preview(a)}<h3>Spell Details</h3><div class="spell-details-table">${[['Range',a.range],['Cast time',a.castTime],['Resource cost',a.cost],['Cooldown',a.cooldown],['Type',a.type],['School',a.school]].map(([label,value])=>`<div><span>${label}</span><p>${esc(value)}</p></div>`).join('')}</div><h3>Spell damage modifiers</h3>${a.detailSourceUrl?`<p class="modifier-source">Source: <a href="${esc(/^https:\/\/(?:foreverdb\.net|www\.wowhead\.com)\//.test(a.detailSourceUrl)?a.detailSourceUrl:'https://foreverdb.net')}" target="_blank" rel="noreferrer">${esc(a.detailSourceVersion||'Database reference')} ↗</a></p>`:''}<div class="effect-row">${esc(a.damageModifiers||(a.detailStatus==='unavailable'?'Not imported — the reference page could not be retrieved.':'No damage modifiers listed in the reference.'))}</div><h3>Effects</h3>${a.effects.trim() ? a.effects.split('\n').filter(Boolean).map((e,i)=>`<div class="effect-row"><span class="muted">EFFECT #${i+1}</span> &nbsp; ${esc(e)}</div>`).join('') : '<div class="effect-row muted">No additional structured effects provided.</div>'}</article>`;
  }

  function tooltipFor(node) {
    const c=current(),tree=c.trees.find(t=>t.id===node.dataset.tree),t=tree?.talents.find(t=>t.id===node.dataset.talentId);if(!t)return;
    const rank=c.ranks[t.id]||0, reason=C.unmet(c,tree,t);
    $('tooltip').innerHTML=`<div class="spell-name">${esc(t.name)}</div><div class="tip-meta">${esc(t.type)} · Rank ${rank}/${t.maxRanks}</div><div class="tip-meta">Requires ${esc(c.name)}</div><div class="desc">${esc(C.description(t,Math.max(1,rank)))}</div>${rank>0&&rank<t.maxRanks?`<div class="tooltip-next-rank"><div>Next rank:</div><div class="desc">${esc(C.description(t,rank+1))}</div></div>`:''}${reason?`<div class="requirements">${esc(reason)}</div>`:''}`;
    $('tooltip').hidden=false;
    const box=node.getBoundingClientRect(),tip=$('tooltip').getBoundingClientRect();
    let left=box.right+10;if(left+tip.width>innerWidth-10)left=Math.max(10,box.left-tip.width-10);
    let top=Math.min(Math.max(10,box.top),innerHeight-tip.height-10);$('tooltip').style.left=left+'px';$('tooltip').style.top=Math.max(10,top)+'px';
  }

function allocate(tree,t,delta,all=false){let result;do{result=C.allocate(current(),tree,t,delta);}while(all&&result.ok&&current().ranks[t.id]<t.maxRanks);if(!result.ok&&(!all||!(current().ranks[t.id]>0)))toast(result.message);save();render();}
document.addEventListener('click',event=>{const node=event.target.closest('button');if(!node)return;if(node.dataset.classId){activeId=node.dataset.classId;abilityQuery='';selectDefault();render();return;}
if(node.dataset.talentId){const tree=current().trees.find(t=>t.id===node.dataset.tree),t=tree?.talents.find(t=>t.id===node.dataset.talentId);if(!t)return;selection={kind:'talent',id:t.id};allocate(tree,t,1,event.shiftKey);return;}
if(node.dataset.abilityId){selectAbility(node.dataset.abilityId);return;}
const action=node.dataset.action;if(action==='rank-plus'||action==='rank-minus'){const s=selected();if(s?.tree)allocate(s.tree,s.item,action==='rank-plus'?1:-1);}
if(action==='reset-all'){current().ranks={};save();render();}if(action==='reset-tree'){const tree=current().trees.find(t=>t.id===node.dataset.tree);if(tree)for(const t of tree.talents)delete current().ranks[t.id];save();render();}});
document.addEventListener('contextmenu',event=>{const node=event.target.closest('[data-talent-id]');if(!node)return;event.preventDefault();const tree=current().trees.find(t=>t.id===node.dataset.tree),t=tree?.talents.find(t=>t.id===node.dataset.talentId);if(t){selection={kind:'talent',id:t.id};allocate(tree,t,-1);}});
for(const name of ['talents','abilities'])$('tab-'+name).addEventListener('click',()=>{view=name;selectDefault();render();});
document.addEventListener('input',event=>{if(event.target.id==='ability-search'){abilityQuery=event.target.value;$('ability-results').innerHTML=abilityCards();}});
document.addEventListener('pointerover',event=>{const node=event.target.closest('[data-talent-id]');if(node&&event.pointerType!=='touch')tooltipFor(node);});
document.addEventListener('pointerout',event=>{if(event.target.closest('[data-talent-id]'))$('tooltip').hidden=true;});
document.addEventListener('focusin',event=>{const node=event.target.closest('[data-talent-id]');if(node)tooltipFor(node);});
document.addEventListener('focusout',event=>{if(event.target.closest('[data-talent-id]'))$('tooltip').hidden=true;});
document.addEventListener('keydown',event=>{if(event.key==='Escape')$('tooltip').hidden=true;});
$('share-build').addEventListener('click',()=>{const url=new URL(location.href);url.search='';url.hash=B.encode(project,current());$('build-link').value=url.href;$('share-dialog').showModal();});
$('copy-link').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('build-link').value);toast('Build link copied.');}catch{$('build-link').focus();$('build-link').select();toast('Copy the selected link.');}});
$('close-share').addEventListener('click',()=>$('share-dialog').close());
window.addEventListener('hashchange',()=>{try{loadBuild(location.hash);view='talents';selectDefault();render();}catch(error){toast(error.message);}});
document.addEventListener('error',event=>{if(event.target.tagName==='IMG'&&!event.target.src.endsWith('inv_misc_questionmark.jpg'))event.target.src='assets/wowhead/inv_misc_questionmark.jpg';},true);
new ResizeObserver(()=>drawDependencyArrows()).observe($('canvas'));selectDefault();render();
})();
