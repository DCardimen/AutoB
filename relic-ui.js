import {artImage,relicArt} from './ui-art.js';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function illuminatedEffect(text){
 return String(text).split(/(\b\d+(?:\.\d+)?(?:%|s|×)?)/g).map((part,i)=>i%2?`<em>${escape(part)}</em>`:escape(part)).join('');
}
export function relicBarHTML(relics,description,{inventory=0,pact=''}={}){
 return `<section class="expedition-relic-bar" aria-label="Active expedition relics"><div class="relic-bar-label"><span>EXPEDITION</span><strong>Relics <b>${relics.length}</b></strong></div><div class="relic-bar-items">${relics.map(r=>`<button class="relic-bar-item" data-relic-preview="${escape(r.id)}" aria-label="${escape(r.name)}: ${escape(description(r))}" data-relic-name="${escape(r.name)}" data-relic-effect="${escape(description(r))}" data-relic-hook="${escape(r.hook||'passive')}" style="--relic:${r.color||'#e7cf91'}">${artImage(relicArt(r.id))}</button>`).join('')||'<p class="relic-bar-empty">Your discoveries belong here. Find relics in treasure caches and at outposts.</p>'}</div><button class="relic-pack-link text-button" data-action="pack">${artImage('pack-00')}<span>Relic pack <b>${inventory}</b></span></button>${pact}</section>`;
}

// A viewport-level panel avoids clipping inside the scrolling relic rail.
// Hover, keyboard focus and touch share the same content and positioning.
let panel,anchor,pinned=false,closeTimer;
const hooks={hit:'ON CONNECTED HITS',hurt:'WHEN TAKING DAMAGE',dodge:'AFTER A DODGE',cast:'AFTER A SKILL',heal:'WHEN HEALING',kill:'AFTER A KNOCKOUT',death:'ON DEFEAT',tick:'PERIODIC EFFECT',fatal:'AT LETHAL DAMAGE',route:'EXPEDITION EFFECT',ai:'COMPANION TACTICS',flat:'ALWAYS ACTIVE',passive:'ALWAYS ACTIVE'};
function hide(){clearTimeout(closeTimer);anchor?.removeAttribute('aria-describedby');panel?.remove();panel=null;anchor=null;pinned=false;}
function place(){
 if(!panel||!anchor?.isConnected){hide();return;}
 const a=anchor.getBoundingClientRect(),p=panel.getBoundingClientRect(),margin=12;
 const x=Math.max(margin,Math.min(innerWidth-p.width-margin,a.left+a.width/2-p.width/2));
 const below=a.bottom+12,top=below+p.height<=innerHeight-margin?below:Math.max(margin,a.top-p.height-12);
 panel.style.left=x+'px';panel.style.top=top+'px';
}
function show(el,pin=false){
 clearTimeout(closeTimer);if(anchor===el){pinned=pin||pinned;place();return;}
 hide();anchor=el;pinned=pin;
 panel=document.createElement('aside');panel.id='expedition-relic-tooltip';panel.className='relic-effect-panel';panel.setAttribute('role','tooltip');panel.style.setProperty('--relic',el.style.getPropertyValue('--relic'));
 panel.innerHTML=`<header>${el.querySelector('img').outerHTML}<div><small>${hooks[el.dataset.relicHook]||'EXPEDITION RELIC'}</small><h3>${escape(el.dataset.relicName)}</h3></div></header><div class="relic-inscription">${illuminatedEffect(el.dataset.relicEffect)}</div><footer>✦ Applies throughout this expedition <span>ESC to dismiss</span></footer>`;
 document.body.append(panel);el.setAttribute('aria-describedby',panel.id);place();
 panel.addEventListener('pointerenter',()=>clearTimeout(closeTimer));panel.addEventListener('pointerleave',scheduleHide);
}
function scheduleHide(){if(!pinned)closeTimer=setTimeout(hide,130);}
let installed=false;
export function installRelicPreviews(){
 if(installed)return;installed=true;
 document.addEventListener('pointerover',e=>{const el=e.target.closest('[data-relic-preview]');if(el&&e.pointerType!=='touch')show(el);});
 document.addEventListener('pointerout',e=>{if(e.target.closest('[data-relic-preview]')&&!e.relatedTarget?.closest('[data-relic-preview],.relic-effect-panel'))scheduleHide();});
 document.addEventListener('focusin',e=>{const el=e.target.closest('[data-relic-preview]');if(el)show(el);else if(!pinned)hide();});
 document.addEventListener('focusout',e=>{if(e.target.closest('[data-relic-preview]')&&!e.relatedTarget?.closest('[data-relic-preview]'))scheduleHide();});
 document.addEventListener('click',e=>{const el=e.target.closest('[data-relic-preview]');if(el){if(anchor===el&&pinned)hide();else show(el,true);}else if(!e.target.closest('.relic-effect-panel'))hide();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel){hide();e.stopImmediatePropagation();}},true);
 window.addEventListener('resize',place);document.addEventListener('scroll',place,true);
}
export function refreshRelicPreviews(){hide();}
