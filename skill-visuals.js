import {pixelSpec} from './native-content.js';
import {equipmentAffinity} from './equipment-affinity.js';

export const SPELL_PALETTES={
 ember:{color:'#e79a58',light:'#ffe7ae',dark:'#61362e',ink:'#191e25'},
 grove:{color:'#91bd7b',light:'#e8efba',dark:'#294e42',ink:'#102b2c'},
 tide:{color:'#7bbecb',light:'#d9f5e8',dark:'#294e67',ink:'#102833'},
 storm:{color:'#baa6e1',light:'#f3e7ff',dark:'#484573',ink:'#192634'},
 void:{color:'#be86c2',light:'#f5d8e8',dark:'#533455',ink:'#202333'},
};
const hash=text=>[...String(text)].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261);
const roles={Guardian:'tide',Support:'grove',Ranger:'storm',Striker:'ember'};
const elements={cinderfall:'ember','root-snare':'grove','tidal-surge':'tide',overcharge:'storm','soul-siphon':'void','aegis-call':'tide','predator-instinct':'ember','astral-salvo':'storm'};
const shapes={dash:'dash',charge:'dash',blink:'dash',shield:'ward',shell:'shell',heal:'heal','heal-all':'heal',chain:'chain',beam:'beam',breath:'breath',blast:'meteor',volley:'salvo',salvo:'salvo',spores:'spores',awakening:'nova',gravity:'gravity',wave:'wave',buff:'haste',drain:'drain',bolt:'bolt',melee:'sword',slam:'hammer',cleave:'claw',double:'claw'};
export function skillVisual(skill={}){
 const id=skill.baseId||skill.id||'',base=id.replace(/^learn-(.*)-[0-3]$/,'$1'),family=skill.species||base.replace(/^auto-/,'').replace(/^evolve-(.*)-(?:wild|warden)-[12]$/,'$1').replace(/-utility$/,''),spec=pixelSpec(family),element=skill.element||elements[base]||spec?.element||roles[skill.role]||'void';
 let shape=shapes[skill.kind]||'bolt';
 if(skill.auto){const affinity=equipmentAffinity({id:family});if(['melee','slam','cleave','double'].includes(skill.kind))shape=affinity==='fang'?(skill.kind==='cleave'||skill.kind==='double'?'claw':'fang'):affinity==='two-handed'?'hammer':'sword';else if(affinity==='bow')shape='bow';else if(affinity==='cannon')shape='cannon';else if(affinity==='staff')shape='staff';}
 if(skill.kind==='spores'&&skill.poison)shape='poison';
 if(skill.kind==='blast'&&skill.root&&element==='grove')shape='roots';
 if(skill.kind==='blast'&&skill.poison)shape='poison';
 if(skill.kind==='wave'&&skill.slow&&element==='tide')shape='frost';
 const palette=SPELL_PALETTES[element]||SPELL_PALETTES.void;
 return {version:2,id:skill.id||base,base,family,element:SPELL_PALETTES[element]?element:'void',kind:skill.kind||'bolt',shape,auto:!!skill.auto,quality:Math.max(0,Math.min(3,skill.quality||0)),stage:skill.evolutionSkill?Math.max(1,Math.min(2,skill.stage||1)):0,path:skill.path||null,seed:hash(base),...palette};
}

// Enamel spell emblems: the silhouette expresses the action, the material
// expresses its element, and the small rim marks express quality/evolution.
const marks={
 roots:'<path d="M64 24v38m0-13L46 36l-9 2m27 24 18-17 13 2M64 62 50 77l-3 22m17-37 14 18 15 8m-29-26 1 28-9 12M50 77l-16 7-7 13m51-17 1 21" fill="none"/><path d="M48 35q-19-16-19 0 10 13 19 0ZM81 45q20-16 20-1-10 13-20 1Z"/>',
 frost:'<path d="M64 24v79M30 44l68 39M30 83l68-39M52 31l12 12 12-12M52 96l12-12 12 12M30 58l16-4-4-16m44 51-4-16 16-4M30 69l16 4-4 16m44-51-4 16 16 4" fill="none"/><path d="m64 50 12 14-12 14-12-14Z"/>',
 drain:'<path d="M90 32C50 18 22 62 43 91 26 56 62 40 84 53 66 42 47 57 53 75 62 96 87 87 92 70" fill="none"/><path d="m35 83 8 8 9-7M64 52c-3 12-15 16-12 27 3 14 26 14 28 0 2-11-12-16-16-27Z"/><path d="m94 23 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
 sword:'<path d="M43 88 49 72 85 30 96 28 94 40 57 80Z"/><path d="m39 75 23 19m-25 1 9-10m1-7 7 6" fill="none"/>',
 fang:'<path d="M35 30C61 34 71 52 47 94 51 65 26 51 35 30Z"/><path d="M76 30C99 43 98 64 72 94 81 65 67 51 76 30Z"/>',
 claw:'<path d="M39 29C57 54 38 70 31 93 49 80 67 59 50 30ZM62 26C80 51 62 74 52 97 71 85 89 55 75 29ZM86 31C101 55 88 75 77 91 95 82 108 57 98 37Z" stroke-width="2"/>',
 bow:'<path d="M47 26Q92 62 47 99M47 26 60 62 47 99M30 62H97m-13-9 13 9-13 9" fill="none"/><path d="m31 55 10 7-10 7" fill="none"/>',
 cannon:'<path d="m33 74 9-31 41 4 12 31-41 8Z"/><path d="m49 53 41 4m-45 9 48 3" fill="none"/><circle cx="86" cy="65" r="13" fill="var(--ink)"/><path d="m35 83-7 12m31-11 4 12" fill="none"/>',
 staff:'<path d="M47 96 66 45M55 88l-9-5m13-8-9-5" fill="none"/><path d="m68 23 15 15-10 22-16-15Z"/><path d="m57 29-12 9m42 11 11-2m-18-22 5-9" fill="none"/>',
 hammer:'<path d="m35 38 15-13 43 24-15 24Z"/><path d="m61 61-20 32 10 7 22-33"/><path d="m43 32 44 25M34 76l-8 6m64-3 7 8" fill="none"/>',
 ward:'<path d="m64 24 32 12-5 35Q83 91 64 101 43 89 37 71L32 36Z"/><path d="m64 35 20 8-4 26Q76 81 64 88 52 80 47 69l-3-26Z" fill="var(--ink)"/><path d="m64 46 6 13 12 5-12 5-6 14-5-14-12-5 12-5Z"/>',
 shell:'<path d="M31 72C27 36 59 24 78 30 103 39 107 70 91 88L64 100 38 88Z"/><path d="m64 34-15 15v22l15 15 17-15V49Zm-15 15-17 1m49-1 18 1M49 71l-13 17m45-17 12 17M64 86v13" fill="none"/>',
 heal:'<path d="M64 26C39 45 48 54 64 60 80 54 89 45 64 26Z"/><path d="M30 58C30 82 48 88 60 70 53 54 43 50 30 58ZM98 58C98 82 80 88 68 70 75 54 85 50 98 58Z"/><path d="m64 51 6 13 14 5-14 6-6 16-6-16-14-6 14-5Z"/><path d="M64 89v12" fill="none"/>',
 bolt:'<path d="M35 90 57 66 44 58 93 28 73 57 86 65Z"/><path d="m35 62-9 10m31 12-9 13m41-16 10-12" fill="none"/>',
 chain:'<path d="m32 84 17-27-12-3 31-28-6 25 14 1-21 28m12 16 17-28-10-3 20-18" fill="none"/><circle cx="32" cy="84" r="6"/><circle cx="68" cy="26" r="6"/><circle cx="67" cy="96" r="5"/>',
 beam:'<path d="m30 92 45-45m-36 49 45-45M25 81l42-42" fill="none"/><path d="m81 21 6 18 18 6-18 6-6 20-6-20-17-6 17-6Z"/>',
 meteor:'<path d="m27 97 15-42 19 10 33-40-6 40-29 30Z"/><circle cx="47" cy="79" r="17"/><path d="m62 36 7-11m27 55 7-7M28 43l-5 12" fill="none"/>',
 salvo:'<path d="M64 99V28m-12 16 12-16 12 16M38 90V44m-9 13 9-13 9 13M90 90V44m-9 13 9-13 9 13" fill="none"/><path d="m54 91 10-8 10 8M30 84l8-6 8 6m36 0 8-6 8 6" fill="none"/>',
 spores:'<path d="M31 68Q32 24 63 32 96 24 99 68Z"/><path d="m50 68-5 25 19 8 19-8-5-25"/><circle cx="48" cy="51" r="5" fill="var(--ink)"/><circle cx="77" cy="48" r="6" fill="var(--ink)"/><path d="m29 86-8 6m79-8 8 6" fill="none"/>',
 poison:'<path d="M64 23C60 42 36 52 38 75 40 100 89 102 92 76 95 57 74 45 64 23Z"/><path d="M50 67q14-12 28 0v13l-10 6h-9l-9-6Z" fill="var(--ink)"/><circle cx="57" cy="73" r="2"/><circle cx="71" cy="73" r="2"/><path d="m59 88-2 5m11-5 2 5" fill="none"/>',
 nova:'<path d="m64 21 10 24 23-11-11 24 22 8-23 11 11 22-22-9-10 20-9-20-23 9 11-22-23-11 22-8-10-24 23 11Z"/><path d="m64 43 14 22-14 22-14-22Z" fill="var(--ink)"/>',
 gravity:'<ellipse cx="64" cy="64" rx="36" ry="16" transform="rotate(-27 64 64)" fill="none"/><circle cx="64" cy="64" r="24"/><path d="M70 43C46 55 49 83 73 87 42 94 28 52 56 41Z" fill="var(--ink)"/><path d="m91 29 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
 wave:'<path d="M24 80C38 33 67 23 83 44 95 60 74 77 61 62 77 65 75 47 63 50 46 55 50 90 100 81 77 110 41 99 24 80Z"/><path d="M30 91Q48 110 86 101M32 42l8-8" fill="none"/>',
 breath:'<path d="m30 64 62-34-9 25 19 9-19 9 9 25Z"/><path d="m46 64 30-13-7 13 7 13Z" fill="var(--ink)"/><circle cx="30" cy="64" r="7"/>',
 haste:'<circle cx="65" cy="65" r="29" fill="none"/><path d="M65 41v25l17 12M36 40 25 29m10 35H19m20 23-13 11m66-51 10-12" fill="none"/><path d="m64 20 7 10-14 1Z"/>',
 dash:'<path d="M26 89C51 87 40 44 76 47L68 28l33 27-32 26 7-19C55 58 67 100 26 89Z"/><path d="m31 67-12 6m24-31-11 5" fill="none"/>',
};
const icons=new Map();
export function skillIconSVG(skill){
 const p=skillVisual(skill),metal=['#a0ac9a','#99c9b8','#baa5df','#edcb86'][p.quality],crest=p.stage?(p.path==='warden'?'#a5d6ba':'#edb379'):metal;
 const rune=Array.from({length:4},(_,i)=>`<path d="m${49+i*10} 109 3-${2+((p.seed>>>(i*3))&3)} 3 ${2+((p.seed>>>(i*3))&3)}"/>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" style="--ink:${p.ink}"><defs><radialGradient id="bg"><stop stop-color="${p.dark}"/><stop offset="1" stop-color="${p.ink}"/></radialGradient><linearGradient id="spell" x2=".8" y2="1"><stop stop-color="${p.light}"/><stop offset=".45" stop-color="${p.color}"/><stop offset="1" stop-color="${p.dark}"/></linearGradient><linearGradient id="rim" x2="1" y2="1"><stop stop-color="#e1d4a6"/><stop offset=".5" stop-color="#596961"/><stop offset="1" stop-color="#a99b6d"/></linearGradient></defs><rect x="3" y="3" width="122" height="122" rx="19" fill="#081d24" stroke="#051419" stroke-width="5"/><rect x="6" y="6" width="116" height="116" rx="16" fill="url(#bg)" stroke="url(#rim)" stroke-width="3"/><path d="M14 35V24q0-10 11-10h11m56 0h12q10 0 10 10v11M14 93v11q0 10 11 10h10m58 0h11q10 0 10-10V93" fill="none" stroke="${metal}" stroke-width="2"/><circle cx="64" cy="63" r="43" fill="none" stroke="${p.color}" stroke-opacity=".15"/><g transform="translate(0 2)" fill="#000" stroke="#000" stroke-width="8" stroke-linejoin="round">${marks[p.shape]||marks.bolt}</g><g fill="url(#spell)" stroke="${p.light}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${marks[p.shape]||marks.bolt}</g><g fill="none" stroke="${metal}" stroke-width="1.5" opacity=".85">${rune}</g>${p.quality?Array.from({length:p.quality},(_,i)=>`<path d="m${53+i*10} 14 3-4 3 4-3 4Z" fill="${metal}"/>`).join(''):''}${p.stage?`<path d="m95 91 21-1v21l-11 8-10-8Z" fill="#122a2c" stroke="${crest}" stroke-width="2"/><text x="105" y="108" text-anchor="middle" font-family="Georgia,serif" font-size="14" fill="${crest}">${p.stage===2?'II':'I'}</text>`:''}${p.auto?'<path d="m15 104 8-5-3 6 7-1-9 7 3-7Z" fill="#e4d39e"/>':''}</svg>`;
}
export function skillIconData(skill){const p=skillVisual(skill),key=[p.base,p.shape,p.element,p.quality,p.stage,p.path,p.auto].join(':');if(!icons.has(key))icons.set(key,'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(skillIconSVG(skill)));return icons.get(key);}
