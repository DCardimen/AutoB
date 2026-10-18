import {planetOrb} from './planet-ui.js';
import {UI_ART,artImage} from './ui-art.js';
export const WORLD_ART = [UI_ART['world-0'],UI_ART['world-1'],UI_ART['world-2']].map(src => {
 if(!src.startsWith('data:'))return src;
 const binary=atob(src.slice(src.indexOf(',')+1));
 return URL.createObjectURL(new Blob([Uint8Array.from(binary,c=>c.charCodeAt(0))],{type:'image/png'}));
});
export const stageArt = index => index===0?UI_ART['stage-grasslands']:worldArt(index);
export const worldArt = index => WORLD_ART[Math.max(0,Math.min(2,index))];
// Original vector artwork for the supplied field UI style.
const paths = {
 star:'M16 2l4 10 10 4-10 4-4 10-4-10L2 16l10-4z',
 battle:'M6 4l17 19M4 6l2-2 6 2M19 19l7 7M19 23l4-4M26 4L9 21M28 6l-2-2-6 2M13 19l-7 7M9 19l4 4',
 elite:'M16 3l4 8 8 5-8 4-4 9-4-9-8-4 8-5zM16 9v14M9 16h14',
 boss:'M5 9l6 5 5-9 5 9 6-5-3 16H8zM8 28h16',
 capture:'M16 27V8M16 19C4 19 4 7 6 4c9 1 12 6 10 15zM16 24c11-1 13-11 11-14-8 0-11 5-11 14',
 shop:'M6 13h20M8 13v14M24 13v14M4 27h24M16 3L5 10h22zM14 15v12M18 15v12',
 event:'M16 27v-7M10 19a8 8 0 1 1 12 0M13 15a4 4 0 1 1 6 0M16 10v5M12 28h8',
 rest:'M16 5v23M5 16h23M8 8l16 16M24 8L8 24',
 lock:'M9 14V9a7 7 0 0 1 14 0v5M7 14h18v15H7zM16 20v4',
 gold:'M16 3a13 13 0 1 0 0 26 13 13 0 1 0 0-26M16 9l5 7-5 7-5-7z',
 heart:'M16 28S2 19 3 10c1-8 10-9 13-2 3-7 12-6 13 2 1 9-13 18-13 18',
 team:'M10 5a5 5 0 1 0 0 10 5 5 0 1 0 0-10M2 28v-4a8 8 0 0 1 16 0v4M23 9a4 4 0 1 0 0 8 4 4 0 1 0 0-8M22 21a7 7 0 0 1 8 7',
 map:'M3 6l8-3 10 4 8-3v22l-8 3-10-4-8 3zM11 3v22M21 7v22',
 gear:'M16 10a6 6 0 1 0 0 12 6 6 0 1 0 0-12M13 3h6l1 5 4 2 4-1 3 5-4 3v4l-3 5-4-1-4 2-1 4h-6l-1-4-4-2-4 1-3-5 4-3v-4l-4-3 3-5 4 1 4-2z',
 arrow:'M5 16h22M19 8l8 8-8 8',
 pause:'M10 6v20M22 6v20',
 sound:'M4 13h6l8-8v22l-8-8H4zM23 10a9 9 0 0 1 0 12',
 help:'M10 10a6 6 0 1 1 11 3l-5 4v3M16 25v2',
};
export function fieldIcon(name,cls='') {const key='icon-'+({map:'formation',gear:'settings',rest:'sparkle',event:'star',shop:'gold',boss:'elite'}[name]||name);if(UI_ART[key])return artImage(key,'field-icon '+cls);return '<svg class="field-icon '+cls+'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(paths[name]||paths.star)+'"/></svg>';}
export function fieldJourney(run,phase,planets) {
 const planet=Math.min(run.planet,2),total=run.route?.length||8,current=Math.min(run.depth+1,total);
 const labels={prep:['Prepare your companions','Inspect the enemy, set your formation, and choose a capture target.'],battle:['The gates are open','Watch their skills, pause to inspect, and follow the capture attempt.'],reward:['Gather your rewards','Choose an upgrade and collect the cache before continuing.'],map:['Choose your next encounter','Follow a connected route. Glowing nodes are available to explore.'],shop:['An outpost awaits','Trade gold for companions, equipment, relics, and capture tools.'],event:['A signal in the wilds','Read the encounter and choose how your expedition responds.'],rest:['A moment of quiet','Rest or train before following the route.'],ended:['Your expedition’s story','Your discoveries remain in the menagerie. Begin another journey.']};
 const [title,hint]=run.complete?['Three worlds explored','Your discoveries remain. A new expedition awaits.']:labels[phase]||labels.prep;
 return '<section class="field-journey" aria-label="Expedition progress" data-field-phase="'+phase+'"><div class="field-worlds">'+planets.map((p,i)=>'<button data-planet-preview="'+i+'" class="field-world '+(i===planet?'current':i>planet?'locked':'explored')+'" style="--world-art:url('+stageArt(i)+')" aria-label="'+p.name+(i>planet?' · locked, preview world':' · preview world')+'">'+planetOrb(i,39)+(i>planet?fieldIcon('lock','field-world-lock'):'')+'<span><small>'+ (i===planet?'CURRENT WORLD':i>planet?'Locked':'WORLD EXPLORED')+'</small><strong>'+p.name+'</strong></span></button>').join('')+'</div><div class="field-stage"><div><span class="section-kicker">WORLD '+(planet+1)+' OF 3 · ENCOUNTER '+current+' / '+total+'</span><h2>'+title+'</h2><p>'+hint+'</p></div><ol class="field-steps" aria-label="Encounter progress">'+Array.from({length:total},(_,i)=>'<li class="'+(i<run.depth?'complete':i===run.depth?'current':'future')+'" aria-label="Encounter '+(i+1)+(i<run.depth?' completed':i===run.depth?' current':' ahead')+'"><span>'+ (i===total-1?fieldIcon('boss'):i<run.depth?'✓':i+1)+'</span></li>').join('')+'</ol></div></section>';
}
export function decorateFieldUI(root=document) {
 const favicon=root.querySelector('link[rel="icon"]');if(favicon&&favicon.getAttribute("href")!==UI_ART["brand-crest"])favicon.href=UI_ART["brand-crest"];
 const crest=root.querySelector('.brand-mark img');if(crest&&crest.getAttribute('src')!==UI_ART['brand-crest'])crest.src=UI_ART['brand-crest'];
 for(const [selector,name] of [['[data-view="arena"] > span','battle'],['[data-view="map"] > span','map'],['[data-view="collection"] > span','team'],['.resource-icon.gold','gold'],['.resource-icon.mint','capture'],['.resource-icon.pink','heart'],['.field-collection-shortcut','team'],['#settings','gear'],['#sound','sound'],['#help','help']]) {
  const el=root.querySelector(selector);if(el&&!el.querySelector('svg'))el.innerHTML=fieldIcon(name);
 }
 const panels=root.querySelectorAll('.panel,.modal');for(const el of panels)el.classList.add('field-surface');
}
