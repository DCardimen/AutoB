import {scaledEffect,itemStrength} from './item-effects.js';
// Personal relics attach to a creature, never to an individual skill. Stable
// legacy IDs preserve every existing item and its inventory identity on upgrade.
const rows=[
 ['scorch-fang','Berserker Fang','flat',{atk:1.20,hp:.90},'Trade 10% maximum health for 20% attack.'],
 ['ward-stone','Casting Bastion','cast',{shield:40},'Completing a cooldown skill gives the wearer 40 shield.'],
 ['quick-shard','Clockwork Heart','flat',{cd:.85},'All cooldown skills recharge 15% faster.'],
 ['moonstone','Blood Moon','hit',{life:.12},'Restore 12% of actual connected hit damage as health.'],
 ['windglass','Ghost Step','dodge',{shield:35,stamina:8},'A physical dodge grants shield and refunds eight stamina.'],
 ['heartseed','Living Seed','tick',{condition:'lowHP',heal:12,interval:1},'Below 35% HP, regenerate twelve health each second.'],
 ['hunters-eye','Patient Hunter','hit',{condition:'far',damage:1.32},'Connected hits beyond 220 ground units deal 32% more damage.'],
 ['ironbark','Ironroot Shell','hurt',{condition:'still',reduction:.78},'Take 22% less direct damage while standing still.'],
 ['spore-ring','Plague Signet','hit',{every:3,poison:4},'Every third connected hit poisons its victim for four seconds.'],
 ['echo-prism','Echo Heart','cast',{echo:.45,delay:.8},'Completed cooldown skills repeat once at 45% power after 0.8s.'],
 ['phoenix-ash','Last Ember','fatal',{revive:.15,shield:30},'Once per battle, survive a lethal blow with 15% health and 30 shield.'],
 ['wanderers-knot','Lone Wanderer','hit',{condition:'alone',damage:1.28},'Deal 28% more hit damage while away from allies.'],
 ['fracture-gem','Shieldbreaker Tooth','hit',{condition:'enemyShield',shred:24},'Connected hits strip 24 additional shield from shielded victims.'],
 ['fork-gem','Storm Branch','hit',{every:4,chain:.45},'Every fourth hit chains to the nearest other enemy at 45% attack.'],
 ['frost-gem','Winter Fang','hit',{every:3,slow:2},'Every third hit slows its victim for two seconds.'],
 ['venom-gem','Black Salt','hit',{wither:2},'Connected hits suppress the victim’s healing for two seconds.'],
 ['cleanse-gem','Purifying Bell','cast',{cleanse:true},'Completed cooldown skills cleanse the wearer’s ailments.'],
 ['reservoir-gem','Overflow Vessel','heal',{overflow:.4},'The wearer receives shield worth 40% of its overhealing.'],
 ['beacon-gem','Retreat Lantern','cast',{retreat:30,shield:20},'Completed casts push the wearer away from the nearest threat and grant shield.'],
 ['hex-gem','Hex Crown','hit',{condition:'poison',damage:1.25},'Deal 25% more hit damage to poisoned enemies.'],
 ['execute-gem','Execution Seal','hit',{condition:'wounded',damage:1.40},'Deal 40% more hit damage to enemies below 30% HP.'],
 ['trap-gem','Bramble Heel','dodge',{root:.5,radius:85},'Dodges root nearby enemies for half a second.'],
 ['siphon-gem','Mirror Thorn','hurt',{reflect:.12},'Reflect 12% of health damage back to the attacker.'],
 ['expose-gem','Duelist Lens','hit',{exposed:1.6},'Connected hits expose their victim for 1.6 seconds.'],
 ['blood-gem','Bloodglass Clock','hurt',{every:3,refresh:1.2},'Every third damaging hit received refunds 1.2s from all cooldowns.'],
 ['relay-gem','Battle Battery','hit',{every:3,stamina:10},'Every third hit restores ten stamina.'],
 ['detonate-gem','Ashen Heart','hit',{every:4,burnDetonate:.5},'Every fourth hit on a burning victim detonates for 50% attack nearby.'],
 ['bodyguard-gem','Last Bastion','hurt',{condition:'lowHP',shield:60,interval:8},'Below 35% HP, a damaging hit grants 60 shield; eight-second recharge.'],
 ['recoil-gem','Momentum Coil','hit',{condition:'moving',damage:1.25},'Hits deal 25% more damage while the wearer is moving.'],
 ['renewal-gem','Spell-fed Springs','cast',{stamina:12},'Completed cooldown skills restore twelve stamina.'],
];
const colors=['#e9b47e','#a7d0c9','#b7a4dc','#9dd0a2'],icons=['✦','◈','☾','❋'];
export const WEARER_RELICS=rows.map(([id,name,hook,effect,desc],i)=>({id,name,hook,effect,desc,icon:icons[i%4],color:colors[i%4],cost:110+(i%5)*15,wearerOnly:true}));
export const WEARER_BY_ID=Object.fromEntries(WEARER_RELICS.map(r=>[r.id,r]));
export function wearerTraits(c){if((c.balanceVersion||0)<17)return [];return (c.relics||[]).map(g=>WEARER_BY_ID[g.id]).filter(r=>r&&r.hook!=='flat').map(r=>({...r,id:'personal:'+r.id,effect:scaledEffect(r.effect,itemStrength(c))}));}
export function wearerStats(c){const out={atk:1,hp:1,cd:1,speed:1,healing:1};if((c.balanceVersion||0)<17)return out;for(const item of c.relics||[]){const r=WEARER_BY_ID[item.id];if(r?.hook==='flat'){const e=scaledEffect(r.effect,itemStrength(c));for(const key of Object.keys(out))out[key]*=e[key]||1;}}return out;}
export function initializeCompanion(run,c){if(!c)return c;c.balanceVersion=Math.max(c.balanceVersion||0,run.rulesVersion||17);c.equipment??=[];c.equipmentRolls??=c.equipment.map(()=>null);c.relics??=[];if(c.balanceVersion>=17)c.relics.forEach(r=>delete r.link);return c;}
