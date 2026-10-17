import {UI_ART} from './ui-art-assets.js';
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const opened=new Set(),scenes=new Map(),frames=[],openFrame='pack-08';

// A small, stable scatter keeps each item's center exposed and leaves the
// inventory order, ownership and rolled stats untouched when a menu refreshes.
export function pouchScatter(uid){
 let hash=2166136261;for(const c of String(uid))hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
 return {x:hash%7-3,y:(hash>>>4)%7-3,angle:(hash>>>8)%19-9,layer:hash%4+1};
}
export function inventoryPouchHTML({kind,title,icon='',items,index,locked=false,empty='Your pouch is empty.'}){
 const gear=kind==='gear',label=gear?'equipment':'Aura Stones',isOpen=opened.has(kind);
 return `<section class="inventory-pouch ${gear?'equipment-pouch':'stone-pouch'}" data-pack-drop="true" data-pack-kind="${kind}" data-pouch-opened="${isOpen}" aria-label="${label} pouch">
 <header>${icon}<div><h3>${title}</h3><small>${locked?'Locked during combat':'Click to equip · drag to a slot'}</small></div><span class="pouch-count" ${gear?'data-equipment-total':''}>${items.length}</span></header>
 <div class="pouch-contents"><div class="pouch-pile" data-pouch-pile tabindex="${isOpen?'0':'-1'}" ${isOpen?'':'inert aria-hidden="true"'} aria-label="Packed ${label}">${items.map(item=>{
  const p=pouchScatter(item.uid),detail=[item.meta,item.description,item.reason].filter(Boolean).join(' · ');
  return `<button type="button" class="pouch-item ${gear?'inventory-equipment':'aura-inventory'} ${item.usable?'pouch-usable':'pouch-incompatible'}" ${gear?'data-gear-equip':'data-equip'}="${escapeHTML(item.uid)}" data-index="${index}" data-pouch-item="${escapeHTML(item.uid)}" data-pouch-name="${escapeHTML(item.name)}" data-pouch-detail="${escapeHTML(detail)}" aria-label="${escapeHTML(item.name+' · '+detail)}" aria-disabled="${locked||!item.usable}" ${locked?'disabled':''} title="${escapeHTML(item.name+' · '+detail)}" style="--pile-x:${p.x}px;--pile-y:${p.y}px;--pile-angle:${p.angle}deg;--pile-layer:${p.layer};--item-color:${item.color||'#b9cf9d'}">${item.art}<span class="sr-only">${escapeHTML(item.name)}</span></button>`;
 }).join('')||`<p class="pouch-empty">${empty}</p>`}</div><img class="pouch-bag-art" src="${UI_ART[isOpen?openFrame:'pack-00']}" alt="" draggable="false"><button type="button" class="pouch-open-control" data-open-pouch aria-expanded="${isOpen}" ${isOpen?'tabindex="-1"':''}><span>${isOpen?'Open':'Hover or tap to open'}</span><span class="sr-only">${title}</span></button></div>
 <div class="pouch-inspector"><strong>${locked?'Equipment is locked':'Choose an item'}</strong><small>${locked?'Finish the battle to change your loadout.':'Hover or focus an item for its effect and compatibility.'}</small></div></section>`;
}

// Short spring simulation: light collisions, damping and wall rebounds keep
// the scatter playful without throwing items outside their grab area.
export function stepPouchPhysics(bodies,{width,height},dt){
 dt=Math.min(1/30,Math.max(0,dt));const damping=Math.exp(-11*dt);
 for(const b of bodies){
  b.vx=(b.vx+(b.tx-b.x)*70*dt)*damping;b.vy=(b.vy+(b.ty-b.y)*70*dt)*damping;
  const speed=Math.hypot(b.vx,b.vy);if(speed>700){b.vx*=700/speed;b.vy*=700/speed;}
  b.x+=b.vx*dt;b.y+=b.vy*dt;
 }
 for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
  const a=bodies[i],b=bodies[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=(a.r+b.r)*.8;
  if(d>=min)continue;const nx=d>.01?dx/d:(i%2?1:-1),ny=d>.01?dy/d:0,push=(min-d)*.24;
  a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;
 }
 for(const b of bodies){
  const left=b.r,right=Math.max(left,width-b.r),top=b.r,bottom=Math.max(top,height-b.r);
  if(b.x<left){b.x=left;b.vx=Math.abs(b.vx)*.35;}else if(b.x>right){b.x=right;b.vx=-Math.abs(b.vx)*.35;}
  if(b.y<top){b.y=top;b.vy=Math.abs(b.vy)*.35;}else if(b.y>bottom){b.y=bottom;b.vy=-Math.abs(b.vy)*.35;}
 }
 return bodies;
}
function dispose(host,scene){cancelAnimationFrame(scene.frame);host.removeEventListener('pointerenter',scene.enter);host.removeEventListener('focusin',scene.focus);host.querySelector('[data-open-pouch]')?.removeEventListener('click',scene.click);scenes.delete(host);}
export function resetInventoryPouches(){for(const [host,scene]of scenes)dispose(host,scene);opened.clear();}
export function openInventoryPouch(host,{focus=false}={}){
 const scene=scenes.get(host);if(!scene)return;
 if(opened.has(host.dataset.packKind)){if(focus)host.querySelector('.pouch-item')?.focus({preventScroll:true});return;}
 opened.add(host.dataset.packKind);scene.open=true;
 const pile=host.querySelector('[data-pouch-pile]'),bag=host.querySelector('.pouch-bag-art'),control=host.querySelector('[data-open-pouch]');
 host.dataset.pouchOpened='true';pile.inert=false;pile.removeAttribute('aria-hidden');pile.tabIndex=0;control.setAttribute('aria-expanded','true');control.tabIndex=-1;
 const reduced=scene.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(reduced){bag.src=UI_ART[openFrame];if(focus)pile.querySelector('button')?.focus({preventScroll:true});return;}
 const width=pile.clientWidth,height=Math.max(pile.scrollHeight,pile.clientHeight),anchor={x:width/2,y:Math.min(pile.clientHeight*.6,100)};
 const bodies=[...pile.querySelectorAll('.pouch-item')].filter(el=>el.offsetTop<pile.clientHeight+50).slice(0,48).map(el=>{
  const seed=pouchScatter(el.dataset.pouchItem);
  return {el,tx:el.offsetLeft+el.offsetWidth/2,ty:el.offsetTop+el.offsetHeight/2,x:anchor.x+seed.x*2,y:anchor.y+seed.y*2,vx:seed.x*18,vy:-55-Math.abs(seed.y)*10,r:el.offsetWidth*.4};
 });
 let start,last;host.classList.add('pouch-opening');
 const draw=(now)=>{
  if(!host.isConnected){dispose(host,scene);return;}
  start??=now;const age=(now-start)/1000,dt=last?Math.min(.032,(now-last)/1000):1/60;last=now;
  const frame=Math.min(8,Math.floor(age/.035));bag.src=UI_ART['pack-'+String(frame).padStart(2,'0')];
  if(age>.12)stepPouchPhysics(bodies,{width,height},dt);
  for(const b of bodies){b.el.style.setProperty('--scatter-x',(b.x-b.tx)+'px');b.el.style.setProperty('--scatter-y',(b.y-b.ty)+'px');b.el.style.setProperty('--scatter-spin',Math.max(-18,Math.min(18,b.vx*.035))+'deg');}
  if(age<1.55){scene.frame=requestAnimationFrame(draw);return;}
  for(const b of bodies){b.el.style.removeProperty('--scatter-x');b.el.style.removeProperty('--scatter-y');b.el.style.removeProperty('--scatter-spin');}
  host.classList.remove('pouch-opening');scene.frame=0;
 };
 scene.frame=requestAnimationFrame(draw);if(focus)pile.querySelector('button')?.focus({preventScroll:true});
}
export function prepareInventoryPouches(root=document,{reducedMotion=false}={}){
 if(!frames.length)for(let i=0;i<=8;i++){const img=new Image();img.src=UI_ART['pack-'+String(i).padStart(2,'0')];frames.push(img);}
 for(const [host,scene]of scenes)if(!host.isConnected)dispose(host,scene);
 for(const host of root.querySelectorAll('.inventory-pouch')){
  if(scenes.has(host)){
   const scene=scenes.get(host);scene.reduced=reducedMotion;
   // A loadout refresh may patch these nodes while the bag is still opening.
   if(scene.frame&&!host.classList.contains('pouch-opening')){cancelAnimationFrame(scene.frame);scene.frame=0;host.querySelectorAll('.pouch-item').forEach(el=>{for(const name of ['--scatter-x','--scatter-y','--scatter-spin'])el.style.removeProperty(name);});host.querySelector('.pouch-bag-art').src=UI_ART[openFrame];}
   continue;
  }
  const scene={reduced:reducedMotion,frame:0};
  scene.enter=e=>{if(e.pointerType!=='touch')openInventoryPouch(host);};
  scene.focus=()=>openInventoryPouch(host);
  scene.click=e=>{e.preventDefault();openInventoryPouch(host,{focus:true});};
  host.addEventListener('pointerenter',scene.enter);host.addEventListener('focusin',scene.focus);host.querySelector('[data-open-pouch]').addEventListener('click',scene.click);scenes.set(host,scene);
 }
}
