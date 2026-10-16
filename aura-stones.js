import {pixelSpec} from './native-content.js';

export const AURA_SLOTS={Common:0,Uncommon:1,Rare:2,Epic:3,Legendary:4};
export const auraSlots=c=>c?.boss?Math.max(3,AURA_SLOTS[pixelSpec(c?.id)?.rarity||c?.rarity]??0):AURA_SLOTS[pixelSpec(c?.id)?.rarity||c?.rarity]??0;
export const auraTier=item=>Math.max(1,Math.min(4,Math.floor(Number(item?.tier)||4)));
export const auraTierLabel=item=>'Tier '+['','I','II','III','IV'][auraTier(item)];
export const auraTierPower=item=>1.2**(4-auraTier(item));
// All effects are continuously positional. Allies include the living wearer.
const rows=[
 ['valor','Valor','allies',200,{atk:.12}],
 ['ironwall','Ironwall','allies',160,{armor:18}],
 ['tailwind','Tailwind','allies',240,{speed:.14}],
 ['quickening','Quickening','allies',180,{attackSpeed:.10}],
 ['clarity','Clarity','allies',180,{cooldownRate:.14}],
 ['wellspring','Wellspring','allies',180,{hpRegen:3}],
 ['renewal','Renewal','allies',200,{healingReceived:.18}],
 ['lifelight','Lifelight','allies',180,{healingPower:.18}],
 ['endurance','Endurance','allies',200,{staminaRecharge:.18}],
 ['precision','Precision','allies',160,{crit:.06}],
 ['veil','Veil','allies',160,{dodge:.05}],
 ['reach','Far Sight','allies',180,{range:25}],
 ['resolve','Resolve','allies',170,{maxPoise:20}],
 ['celerity','Celerity','allies',180,{actionSpeed:.12}],
 ['shelter','Shelter','allies',150,{damageTaken:-.1}],
 ['frailty','Frailty','enemies',160,{atk:-.12}],
 ['corrosion','Corrosion','enemies',150,{armor:-18}],
 ['quicksand','Quicksand','enemies',160,{speed:-.14}],
 ['lethargy','Lethargy','enemies',160,{attackSpeed:-.14}],
 ['clockwork','Clockwork Relay','allies',150,{cooldownReset:1,interval:3}],
 ['drought','Drought','enemies',160,{healingReceived:-.22}],
 ['blight','Blight','enemies',160,{healingPower:-.18}],
 ['exhaustion','Exhaustion','enemies',150,{staminaRecharge:-.2}],
 ['battle-battery','Battle Battery','allies',160,{stamina:15,interval:4}],
 ['revelation','Revelation','enemies',160,{dodge:-.05}],
 ['heart-pulse','Heart Pulse','allies',170,{currentHPHeal:.04,interval:4}],
 ['bulwark-pulse','Bulwark Pulse','allies',150,{shieldPulse:.035,interval:5}],
 ['tempo','Tempo Lantern','allies',180,{haste:1.2,interval:5}],
 ['vulnerability','Vulnerability','enemies',140,{damageTaken:.12}],
 ['purity','Purity Bell','allies',150,{cleanse:1,interval:6}],
];
const labels={atk:'attack',armor:'armor',speed:'movement speed',attackSpeed:'basic attack speed',cooldownRate:'cooldown recharge',hpRegen:'HP regenerated per second',healingReceived:'healing received',healingPower:'healing power',staminaRecharge:'stamina recovery',crit:'critical chance',dodge:'dodge chance',range:'attack range',maxPoise:'poise',actionSpeed:'action speed',damageTaken:'incoming damage'};
const flat=new Set(['armor','hpRegen','range','maxPoise']),chance=new Set(['crit','dodge']);
export function auraDescription(stone){const power=auraTierPower(stone),e=stone.effect,n=v=>+(v*power).toFixed(2);let text;if(e.interval){const interval=e.cooldownReset||e.cleanse?+(e.interval/power).toFixed(2):e.interval;text=`Every ${interval}s, `+(e.cooldownReset?'reset one cooling skill on the nearest eligible ally':e.currentHPHeal?`heal nearby allies for ${n(e.currentHPHeal*100)}% of the wearer's current HP`:e.haste?`grant ${n(e.haste)}s haste to one nearby ally`:e.shieldPulse?`shield nearby allies for ${n(e.shieldPulse*100)}% of the wearer's max HP`:e.stamina?`restore ${n(e.stamina)} stamina to one nearby ally`:'cleanse one nearby ally');}else text=Object.entries(e).map(([key,value])=>{const v=value*power,amount=+(flat.has(key)?v:v*100).toFixed(1);return `${v>=0?'+':''}${amount}${flat.has(key)?'':chance.has(key)?' percentage points':'%'} ${labels[key]}`;}).join(', ')+` for ${stone.target==='allies'?'allies':'enemies'}`;return `${auraTierLabel(stone)} · ${stone.role} only. ${text} within ${stone.radius} ground units. Allies include the wearer. Active only while the wearer is alive. Identical auras use the strongest tier; different auras combine with stat caps.`;}
// Map effects to the authored stone silhouettes, not arbitrary catalog order.
const artIndex=[1,12,17,18,20,2,8,13,16,18,7,0,10,21,12,9,6,5,15,23,6,3,22,4,13,11,24,7,19,14];
const arts=artIndex.map(i=>'aura-stone-'+String(i).padStart(2,'0'));
const roles=['Striker','Guardian','Striker','Striker','Support','Support','Support','Support','Guardian','Ranger','Ranger','Ranger','Guardian','Striker','Guardian','Guardian','Ranger','Ranger','Striker','Support','Support','Support','Striker','Striker','Ranger','Support','Guardian','Support','Ranger','Support'];
export const AURA_STONES=rows.map(([key,name,target,radius,effect],i)=>{const s={id:'aura-'+key,name:name+' Stone',role:roles[i],target,radius,effect,hook:'aura',aura:true,tier:4,icon:'\u25c8',color:target==='allies'?'#a3e8cc':'#dfa3cf',art:arts[i],cost:130+(i%4)*20};return {...s,desc:auraDescription(s)};});
export const AURA_BY_ID=Object.fromEntries(AURA_STONES.map(s=>[s.id,s]));
export function auraStone(item){const base=AURA_BY_ID[typeof item==='string'?item:item?.id];if(!base)return null;const stone={...base,tier:auraTier(item)};stone.desc=auraDescription(stone);return stone;}
export function auraCompatibility(c,item){const s=AURA_BY_ID[typeof item==='string'?item:item?.id];if(!s)return {allowed:true,reason:'Legacy item'};if(auraSlots(c)===0)return {allowed:false,reason:'Common companions have no Aura Stone slots'};return (pixelSpec(c?.id)?.role||c?.role)===s.role?{allowed:true,reason:s.role+' Aura Stone'}:{allowed:false,reason:s.role+' companions only'};}
export const equippedAuras=c=>(c.relics||[]).map(auraStone).filter(s=>s&&auraCompatibility(c,s).allowed).slice(0,auraSlots(c));
const hash=text=>[...String(text)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,7);
export const migratedStoneId=id=>AURA_BY_ID[id]?id:AURA_STONES[hash(id)%AURA_STONES.length].id;
export function migrateAuraStones(run){let changed=0;run.inventory??=[];const convert=g=>{if(!g)return;if(!AURA_BY_ID[g.id]){g.legacyId??=g.id;g.id=migratedStoneId(g.id);delete g.link;changed++;}if(!g.tier){g.tier=4;changed++;}};for(const c of [...run.team||[],...run.bench||[]]){const seen=new Set();c.relics=(c.relics||[]).filter(g=>{convert(g);if(seen.has(g.id)||seen.size>=auraSlots(c)||!auraCompatibility(c,g).allowed){run.inventory.push(g);changed++;return false;}seen.add(g.id);return true;});}for(const g of run.inventory)convert(g);run.auraVersion=1;return changed;}
function random(seed){let n=seed>>>0;return()=>{n+=0x6d2b79f5;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
export function enemyAuraTier(c){if(c.boss)return 1;if(c.elite)return auraTier({tier:c.eliteTier||3});return {Common:4,Uncommon:4,Rare:3,Epic:2,Legendary:1}[pixelSpec(c.id)?.rarity]||4;}
export function assignEnemyStones(c,seed,progress=0){if(c.auraLoadoutVersion===1)return c;c.auraLoadoutVersion=1;const limit=Math.min(3,auraSlots(c));if(!limit){c.relics=[];return c;}if((c.relics||[]).some(g=>AURA_BY_ID[g.id])){c.relics=c.relics.filter(g=>AURA_BY_ID[g.id]&&auraCompatibility(c,g).allowed).slice(0,limit);return c;}const r=random(seed^0x6a09e667),carry=c.boss||r()<(c.elite?.6:.2);c.relics=[];if(!carry)return c;const pool=AURA_STONES.filter(s=>s.role===(pixelSpec(c.id)?.role||c.role)),max=c.boss?3:c.elite?Math.min(3,1+Math.floor(progress/3)):1,roll=r(),count=Math.min(limit,c.boss?3:Math.min(max,roll<.7?1:roll<.95?2:3));for(let i=0;i<count;i++){const stone=pool.splice(Math.floor(r()*pool.length),1)[0];c.relics.push({uid:`${c.uid}:aura:${i}`,id:stone.id,tier:enemyAuraTier(c)});}return c;}
export function enemyStoneDrops(c,key){return equippedAuras(c).map((s,i)=>({id:`${key}:stone:${i}`,kind:'stone',stone:s.id,tier:s.tier,sourceId:c.id,sourceName:pixelSpec(c.id)?.name||c.id,sourceLevel:c.level||1,sourceUid:c.uid,x:c.x,y:c.y}));}
const multiplierKeys=new Set(['atk','speed','attackSpeed','actionSpeed','staminaRecharge']);
// Remove the previous contribution before applying the newly evaluated one.
// This preserves unrelated changes such as boss enrage without compounding aura stats.
export function updateAuras(units){const alive=units.filter(u=>u.hp>0),sources=alive.flatMap(u=>equippedAuras(u).map(s=>({u,s})));
 for(const target of units){const strongest=new Map();if(target.hp>0)for(const {u,s}of sources){if(s.effect.interval||(s.target==='allies')!==(u.side===target.side)||Math.hypot(u.x-target.x,u.y-target.y)>s.radius)continue;const previous=strongest.get(s.id);if(!previous||previous.tier>s.tier)strongest.set(s.id,s);}const sum={};for(const s of strongest.values())for(const [key,value]of Object.entries(s.effect))sum[key]=(sum[key]||0)+value*auraTierPower(s);const prev=target.auraApplied||{};
  for(const key of multiplierKeys){const next=Math.max(.4,Math.min(1.8,1+(sum[key]||0)));target[key]=(target[key]||0)/(prev[key]||1)*next;sum[key]=next;}
  for(const key of ['armor','hpRegen','range','maxPoise','dodge']){const base=(target[key]||0)-(prev[key]||0),next=Math.max(key==='range'?Math.min(base,25):0,Math.min(key==='dodge'?.65:Infinity,base+(sum[key]||0)));sum[key]=next-base;target[key]=next;}
  target.auraCooldownRate=Math.max(.5,Math.min(1.75,1+(sum.cooldownRate||0)));target.auraHealingPower=Math.max(.25,Math.min(2,1+(sum.healingPower||0)));target.auraHealingReceived=Math.max(.25,Math.min(2,1+(sum.healingReceived||0)));target.auraDamageTaken=Math.max(.55,Math.min(1.6,1+(sum.damageTaken||0)));target.auraCrit=sum.crit||0;target.auraDodge=sum.dodge||0;target.activeAuras=[...strongest.values()].map(s=>({id:s.id,tier:s.tier}));target.auraApplied=sum;
 }
}
export function tickAuras(b){for(const u of b.units.filter(u=>u.hp>0))for(const s of equippedAuras(u).filter(s=>s.effect.interval)){const e=s.effect,power=auraTierPower(s),interval=e.cooldownReset||e.cleanse?e.interval/power:e.interval;u.auraTimers??={};const next=u.auraTimers[s.id]??interval;if(b.time+1e-9<next)continue;u.auraTimers[s.id]=b.time+interval;const targets=b.units.filter(t=>t.hp>0&&t.side===u.side&&Math.hypot(t.x-u.x,t.y-u.y)<=s.radius&&!b.units.some(other=>other!==u&&other.hp>0&&other.side===u.side&&equippedAuras(other).some(a=>a.id===s.id&&(a.tier<s.tier||a.tier===s.tier&&String(other.uid)<String(u.uid))&&Math.hypot(t.x-other.x,t.y-other.y)<=a.radius))).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y)||String(a.uid).localeCompare(String(c.uid)));if(e.cooldownReset){const candidate=targets.map(t=>({t,cd:Object.values(t.cooldowns||{}).filter(cd=>cd.remaining>0).sort((a,c)=>c.remaining-a.remaining)[0]})).find(v=>v.cd);if(candidate)candidate.cd.remaining=0;}if(e.currentHPHeal){const amount=u.hp*e.currentHPHeal*power;for(const t of targets)b.heal(t,amount,u,null,false);}if(e.shieldPulse)for(const t of targets)t.shield=Math.min(t.maxHp*.8,(t.shield||0)+u.maxHp*e.shieldPulse*power);if(e.haste&&targets.length){const t=targets.find(t=>t!==u)||targets[0];t.haste=Math.max(t.haste||0,e.haste*power);}if(e.stamina&&targets.length){const t=targets.filter(t=>t.stamina<100).sort((a,c)=>a.stamina-c.stamina)[0];if(t)t.stamina=Math.min(100,t.stamina+e.stamina*power);}if(e.cleanse){const t=targets.find(t=>['burn','poison','bleed','wither','slow','root','weakened','exposed'].some(key=>t[key]>0));if(t)b.cleanse(t);}b.metrics.auraPulses=(b.metrics.auraPulses||0)+1;}}
