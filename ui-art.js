import {UI_ART} from './ui-art-assets.js';
import {CREATURE_GEAR, GEAR_BY_ID} from './creature-equipment.js';
import {RELICS} from './game.js';
import {WEARER_RELICS} from './wearer-relics.js';
import {SKILLS} from './skills.js';

export {UI_ART};
const ART_VARIABLES={frame:'arena-frame',panel:'leaf-panel',gold:'gold-action',collect:'collect-button','collect-hover':'collect-hover',card:'reward-card','card-hover':'reward-card-hover','card-grove':'reward-card-grove',slot:'gear-slot',empty:'empty-slot',tab:'tab','tab-active':'tab-selected',result:'result-panel',rewards:'rewards-backdrop',leaves:'reward-leaves',failure:'capture-failed',success:'capture-success',companion:'companion-card',hp:'bar-health','enemy-hp':'bar-enemy',stamina:'bar-stamina',poise:'bar-poise'};
let installedArtVariables=false;
export function artImage(key, cls='', alt='') {
 const src=UI_ART[key];
 return src ? `<img class="uploaded-art ${cls}" src="${src}" alt="${alt}" draggable="false" decoding="async">` : '';
}

// Stable identities: catalog order is only used to assign the initial map.
// Runtime pose, gait, randomness and equipped slot positions never choose art.
const slotPools={Weapon:['weapon',0,25],Armor:['armor',0,10],Boots:['accessory',5,5],Cape:['armor',4,2],Focus:['focus',10,15],Core:['relic-2',0,25]};
const counts={};
export const GEAR_ART=Object.fromEntries(CREATURE_GEAR.map(g=>{
 const [prefix,start,length]=slotPools[g.slot]||['accessory',10,15];
 const n=counts[g.slot]||0;counts[g.slot]=n+1;
 return [g.id,`${prefix}-${String(start+n%length).padStart(2,'0')}`];
}));
Object.assign(GEAR_ART,{
 'sunsteel-edge':'skill-00','starter-sunsteel-edge':'skill-00',
 'reliquary-plate':'armor-00','starter-reliquary-plate':'armor-00',
 'mooncloth-mantle':'accessory-21','windstep-boots':'accessory-06',
 'venom-sabre':'treasure-00','cinder-cleaver':'weapon-01','frost-rapier':'weapon-09',
 'thorn-halberd':'weapon-20','siege-maul':'weapon-10','storm-conductor':'weapon-23',
 'vampire-tooth':'weapon-08','sundering-glaive':'weapon-22',
 'prism-focus':'focus-23','citadel-core':'focus-20','mirror-cuirass':'armor-05',
 'bramble-coat':'armor-08','stoneheart-plate':'armor-00','rageplate':'armor-01',
 'blink-boots':'accessory-07','frost-treads':'accessory-08','guardian-greaves':'accessory-05',
 'echo-prism':'focus-22','winter-lens':'accessory-12','battery-orb':'focus-18',
 'spring-idol':'focus-19','purity-lantern':'relic-1-04',
});
export const RELIC_ART=Object.fromEntries([...RELICS,...WEARER_RELICS].map((r,i)=>[r.id,`relic-${1+Math.floor(i/25)%4}-${String(i%25).padStart(2,'0')}`]));
Object.assign(RELIC_ART,{fangs:'relic-4-23',clock:'relic-2-20',seed:'relic-1-00',prism:'relic-2-12',lens:'relic-2-08',banner:'relic-2-06',feather:'relic-1-12',coin:'relic-4-00',bond:'relic-1-21'});
export const gearArt=id=>GEAR_ART[id]||'weapon-00';
export const relicArt=id=>RELIC_ART[id]||'relic-1-00';
export const lootArt=d=>d.kind==='gear'?gearArt(d.gear):d.kind==='capturer'?`capture-${d.tier}-idle`:d.kind==='relic'?relicArt(d.relic):'treasure-01';
export function skillArt(skill) {
 if(skill?.auto)return 'skill-00';
 const type=skill?.type||'',id=skill?.id||'';
 if(/heal|mend|bloom|restore/.test(type+' '+id))return 'icon-healing';
 if(/shield|guard|barrier/.test(type+' '+id))return 'skill-01';
 if(/dash|charge|step/.test(type+' '+id))return 'skill-03';
 if(/storm|spark|volt|chain/.test(id))return 'skill-06';
 if(/moon|night|void|curse/.test(id))return 'skill-07';
 if(/wave|frost|tide|water/.test(id))return 'skill-02';
 return 'skill-11';
}

export function decorateUploadedArt(root=document) {
 if(!root)return;
 // Large data URLs exceed browser CSS custom-property limits. The offline
 // registry already provides compact blob URLs; share them with the CSS skin.
 if(!installedArtVariables){for(const [name,key]of Object.entries(ART_VARIABLES))document.documentElement.style.setProperty('--upload-'+name,`url("${UI_ART[key]}")`);installedArtVariables=true;}
 for(const el of root.querySelectorAll('.inventory-item,.relic-slot.equipped,.personal-inventory [data-equip]')){
  const name=el.querySelector('strong')?.textContent,r=WEARER_RELICS.find(r=>r.name===name),icon=el.querySelector('span');
  if(r&&icon&&!icon.querySelector('.uploaded-art'))icon.innerHTML=artImage(relicArt(r.id),'relic-art');
 }
 for(const el of root.querySelectorAll('[data-action^="buy-gear-"],[data-action^="buy-capturer-"]')){
  const action=el.dataset.action,card=el.parentElement;if(card.querySelector('.item-art,.capturer-art'))continue;
  const key=action.startsWith('buy-gear-')?gearArt(action.slice(9)):'capture-'+action.slice(13)+'-idle';
  card.insertAdjacentHTML('afterbegin',artImage(key,action.startsWith('buy-gear-')?'item-art':'capturer-art'));
 }
 for(const el of root.querySelectorAll('[data-unit-skill],[data-hud-skill]')){
  const id=el.dataset.hudSkill||el.dataset.unitSkill.split(':')[1];
  const target=el.dataset.hudSkill?el.querySelector('span'):el;
  if(!target||target.querySelector('img.uploaded-art'))continue;
  for(const node of [...target.childNodes])if(node.nodeType===3)node.remove();
  target.insertAdjacentHTML('afterbegin',artImage(skillArt({...SKILLS[id],id}),'ability-art'));
 }
 // Existing handlers and drag/drop attributes remain on their source buttons.
 for(const el of root.querySelectorAll('[data-gear-equip],[data-gear-remove],[data-gear-claim]')) {
  if(el.querySelector('.item-art'))continue;
  let id=el.dataset.gearClaim||el.dataset.itemId;
  if(!id){const name=el.querySelector('strong')?.textContent;id=CREATURE_GEAR.find(g=>g.name===name)?.id;}
  if(id&&GEAR_BY_ID[id])el.insertAdjacentHTML('afterbegin',artImage(gearArt(id),'item-art'));
 }
 for(const el of root.querySelectorAll('[data-relic],[data-enemy-relic]')) {
  const id=el.dataset.relic||el.dataset.enemyRelic;
  if(!el.querySelector('.uploaded-art'))el.insertAdjacentHTML('afterbegin',artImage(relicArt(id),'relic-art'));
 }
 for(const el of root.querySelectorAll('[data-capture-method]')) {
  if(el.querySelector('.uploaded-art'))continue;
  for(const node of [...el.childNodes])if(node.nodeType===3)node.remove();
  el.insertAdjacentHTML('afterbegin',artImage(`capture-${el.dataset.captureMethod}-${el.disabled?'spent':el.classList.contains('selected')?'ready':'idle'}`,'capturer-art'));
 }
}
