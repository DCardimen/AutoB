// One hundred expedition curios. Each entry describes executable behavior.
const rows=[
['star-chart','Star Chart','route',{sight:1},'Reveal one additional encounter ahead.'],
['oracle-lens','Oracle Lens','route',{sight:2},'Reveal two additional encounters ahead.'],
['atlas-of-echoes','Atlas of Echoes','route',{sight:1,eliteGold:.3},'Scout one extra room; elite victories yield 30% more gold.'],
['veil-corridor','Veil Corridor','route',{warp:1},'Once per planet, take any visible next-room connection.'],
['pilgrim-thread','Pilgrim Thread','route',{sight:1,restXP:25},'Reveal one extra room. Rest training grants 25 extra EXP.'],
['battle-compass','Battle Compass','route',{battleGold:12},'Each ordinary battle grants 12 extra gold.'],
['merchant-seal','Merchant Seal','route',{discount:.15},'Shop prices are 15% lower; your gold can fund a different build.'],
['empty-purse','Empty Purse','route',{lowGold:40},'Victories grant 20 extra gold when you entered with under 40 gold.'],
['guild-charter','Guild Charter','route',{permitDiscount:.3},'Hiring permits cost 30% less.'],
['rift-map','Rift Map','route',{warp:2,sight:1},'Scout one extra room and cross two disconnected next-room edges per planet.'],
['prism-nest','Prism Nest','route',{extraTool:true},'Every victory cache includes a Scout Prism.'],
['cage-smith','Cage Smith','route',{toolUpgrade:1},'Capturer drops from elite and boss caches advance one tier.'],
['patient-loom','Patient Loom','route',{captureBonus:.08},'Captures at 30% HP or less gain eight percentage points.'],
['silken-hook','Silken Hook','route',{statusCapture:.1},'Poisoned, burning, rooted or slowed targets are ten points easier to capture.'],
['returning-prism','Returning Prism','route',{refundCapture:.25},'A failed capture has a 25% chance to return its capturer, once per attempt.'],
['beast-ledger','Beast Ledger','route',{captureGold:35},'Successful captures grant 35 gold for recruiting or equipment.'],
['nursery-bell','Nursery Bell','route',{captureXP:40},'A successful capture grants the deployed team 40 EXP.'],
['treasure-moth','Treasure Moth','route',{extraLoot:true},'Every victory cache contains an additional unique relic.'],
['contract-ink','Contract Ink','route',{eliteGold:.35,bossGold:.2},'Elite and boss victories pay 35% and 20% more gold.'],
['royal-stables','Royal Stables','route',{recruitDiscount:.2},'Recruit offers cost 20% less. Buy the stat profile your team needs.'],
['venom-clasp','Venom Clasp','hit',{poison:2},'Connected attacks and spells poison their victim for two seconds.'],
['ember-script','Ember Script','hit',{burn:2},'Connected hits burn their victim for two seconds.'],
['thorn-cuff','Thorn Cuff','hit',{every:3,root:.55},'Every third connected hit roots the victim for 0.55s. Charged creatures resist roots.'],
['winter-talon','Winter Talon','hit',{slow:1.4},'Connected hits chill the victim for 1.4s.'],
['fracture-nail','Fracture Nail','hit',{shred:18},'A connected hit destroys 18 extra shield before the next strike.'],
['copper-conductor','Copper Conductor','hit',{every:3,chain:.45},'Every third hit arcs 45% attack into a different enemy.'],
['serpent-contract','Serpent Contract','hit',{condition:'poison',damage:1.35},'Deal 35% more hit damage to poisoned enemies. Build around sustained poison.'],
['charcoal-mirror','Charcoal Mirror','hit',{condition:'burn',damage:1.35},'Deal 35% more hit damage to burning enemies.'],
['shatter-oath','Shatter Oath','hit',{condition:'slow',damage:1.4},'Deal 40% more hit damage to slowed enemies.'],
['execution-script','Execution Script','hit',{condition:'wounded',damage:1.45},'Deal 45% more damage below 30% enemy HP.'],
['dawn-cord','Dawn Cord','hit',{condition:'shielded',damage:1.25},'While the attacker has a shield, its connected hits deal 25% more damage.'],
['duelist-knot','Duelist Knot','hit',{condition:'alone',damage:1.3},'Deal 30% more damage when no ally is within 130 ground units.'],
['pack-standard','Pack Standard','hit',{condition:'nearAlly',damage:1.2},'Deal 20% more hit damage while close to another ally.'],
['sniper-script','Sniper Script','hit',{condition:'far',damage:1.35},'Connected hits beyond 220 ground units deal 35% more damage.'],
['pit-fighter-chain','Pit Fighter Chain','hit',{condition:'close',damage:1.25},'Connected hits inside 75 ground units deal 25% more damage.'],
['blood-signet','Blood Signet','hit',{life:.12},'Connected hits restore 12% of the HP damage actually dealt.'],
['fervor-spindle','Fervor Spindle','hit',{every:4,haste:3},'Every fourth connected hit grants three seconds of attack haste.'],
['guardbreaker','Guardbreaker','hit',{every:3,stun:70},'Every third connected hit deals 70 extra poise impact. Charged attacks remain protected.'],
['momentum-band','Momentum Band','hit',{condition:'moving',damage:1.3},'Hits deal 30% more damage while the attacker is moving.'],
['stamina-spike','Stamina Spike','hit',{stamina:4},'Every connected hit restores four stamina.'],
['recharge-tooth','Recharge Tooth','hit',{every:3,refresh:1.5},'Every third hit removes 1.5 seconds from all of that creature’s cooldowns.'],
['splash-rune','Splash Rune','hit',{every:3,splash:.4,radius:90},'Every third hit splashes 40% attack to enemies within 90 units of the victim.'],
['black-salt','Black Salt','hit',{wither:2},'Connected hits suppress the victim’s healing for two seconds.'],
['hunter-eye','Hunter Eye','hit',{exposed:2},'Connected hits expose the victim for two seconds, increasing later damage taken.'],
['storm-suture','Storm Suture','hit',{every:4,shield:35},'Every fourth connected hit gives the attacker 35 shield.'],
['spellblade-thread','Spellblade Thread','hit',{auto:true,condition:'castRecent',damage:1.55},'For three seconds after casting, basic attacks deal 55% more hit damage.'],
['ashen-needle','Ashen Needle','hit',{every:3,burn:4,slow:1},'Every third hit applies four seconds of burn and one second of slow.'],
['venom-hourglass','Venom Hourglass','hit',{condition:'poison',refresh:.6},'Hits on poisoned targets remove 0.6s from the attacker’s cooldowns.'],
['pressure-crown','Pressure Crown','hit',{condition:'enemyShield',damage:1.4},'Hits against a shielded enemy deal 40% more damage.'],
['interruption-hook','Interruption Hook','hit',{condition:'channel',stun:55,refresh:1},'Hits on an interruptible enemy channel add 55 poise impact and refund one cooldown second.'],
['mirror-thorns','Mirror Thorns','hurt',{reflect:.15},'Return 15% of HP damage taken to the attacker. Reflections cannot reflect again.'],
['pain-furnace','Pain Furnace','hurt',{refresh:1,every:3},'Every third damaging hit received removes one second from cooldowns.'],
['last-bastion','Last Bastion','hurt',{condition:'lowHP',shield:65,interval:8},'Below 35% HP, taking damage grants 65 shield; eight-second per-creature cooldown.'],
['smoke-vessel','Smoke Vessel','hurt',{condition:'lowHP',evade:4,interval:8},'Below 35% HP, a damaging hit grants four seconds of faster dodge recovery.'],
['resolute-heart','Resolute Heart','hurt',{stamina:8},'Each damaging hit received restores eight stamina.'],
['grudge-flower','Grudge Flower','hurt',{condition:'close',poison:3},'Close attackers are poisoned for three seconds when they damage the wearer.'],
['frost-buckle','Frost Buckle','hurt',{slow:1.5},'Attackers who deal HP damage are slowed for 1.5s.'],
['scarlet-barrier','Scarlet Barrier','hurt',{condition:'lowHP',reduction:.8},'Below 35% HP, incoming hit damage is reduced by 20%.'],
['linked-bastion','Linked Bastion','hurt',{condition:'nearAlly',reduction:.85},'Take 15% less hit damage while close to an ally.'],
['wanderer-shell','Wanderer Shell','hurt',{condition:'alone',reduction:.8},'Take 20% less hit damage while isolated from allies.'],
['dodge-battery','Dodge Battery','dodge',{stamina:12},'Starting a physical dodge roll restores twelve stamina.'],
['ghost-lantern','Ghost Lantern','dodge',{shield:30},'Starting a physical dodge roll grants 30 shield.'],
['storm-footprint','Storm Footprint','dodge',{splash:.6,radius:100},'A dodge releases a storm pulse for 60% attack within 100 units.'],
['evasive-clock','Evasive Clock','dodge',{refresh:2},'Starting a physical dodge removes two seconds from cooldowns.'],
['bramble-footprint','Bramble Footprint','dodge',{root:.55,radius:95},'A dodge roots enemies within 95 units for 0.55s; charged enemies resist.'],
['running-aegis','Running Aegis','tick',{condition:'moving',shield:6,interval:1},'Gain six shield each second spent moving.'],
['stillwater-shell','Stillwater Shell','tick',{condition:'still',shield:9,interval:1},'Gain nine shield per second while holding still.'],
['escort-pollen','Escort Pollen','tick',{condition:'nearAlly',heal:7,interval:1},'Restore seven HP per second while close to an ally.'],
['lone-comet','Lone Comet','tick',{condition:'alone',haste:1.2,interval:1},'While isolated, refresh a short attack-haste window each second.'],
['anchor-of-life','Anchor of Life','fatal',{revive:.18,shield:40},'Once per creature per battle, survive a lethal blow at 18% HP with 40 shield. Defeat losses still apply.'],
['echo-script','Echo Script','cast',{echo:.5,delay:.65},'Cooldown skills repeat after 0.65s at 50% power. Repeats cannot repeat themselves.'],
['slow-echo','Slow Echo','cast',{echo:.8,delay:1.5},'Cooldown skills repeat at 80% power after 1.5s, allowing targets time to move.'],
['blood-echo','Blood Echo','cast',{echo:.65,delay:.5,selfHP:.05},'Skills repeat at 65% power, but the caster pays 5% max HP per original cast.'],
['casting-aegis','Casting Aegis','cast',{shield:35},'A completed cooldown cast grants its caster 35 shield.'],
['quickglass','Quickglass','channel',{factor:.65},'Cooldown windup commitments are 35% shorter. Recovery and dodge costs still matter.'],
['tyrant-sigil','Tyrant Sigil','cast',{splash:.65,radius:95},'A completed cooldown cast bursts for 65% attack around the caster.'],
['winter-script','Winter Script','cast',{slow:2,radius:130},'Casting slows enemies within 130 units for two seconds.'],
['purging-voice','Purging Voice','cast',{cleanse:true},'A completed cooldown cast cleanses the caster’s burn, poison, bleed and root.'],
['phase-thread','Phase Thread','cast',{retreat:35,shield:15},'Casting pushes the caster away from the nearest enemy and grants 15 shield.'],
['spell-fed-springs','Spell-fed Springs','cast',{stamina:15},'A completed cooldown cast restores fifteen stamina.'],
['overflow-vessel','Overflow Vessel','heal',{overflow:.6},'Convert 60% of excess healing into the healed ally’s shield.'],
['medic-spindle','Medic Spindle','heal',{refresh:1},'A meaningful heal refunds one second of the healer’s cooldowns; once per second.'],
['blessing-thorns','Blessing Thorns','heal',{thorns:.35},'A meaningful heal sends a 35% attack thorn pulse into the nearest enemy.'],
['cleansing-nectar','Cleansing Nectar','heal',{cleanse:true},'Meaningful heals also cleanse burn, poison, bleed and root.'],
['renewal-banner','Renewal Banner','heal',{haste:2},'Meaningful heals grant the recipient two seconds of attack haste.'],
['trophy-bell','Trophy Bell','kill',{refresh:4},'A knockout removes four seconds from the killer’s cooldowns.'],
['carrion-mantle','Carrion Mantle','kill',{healPercent:.15},'A knockout restores 15% max HP to the killer.'],
['corpse-seed','Corpse Seed','death',{splash:.8,radius:100},'A fallen creature explodes for 80% attack against enemies within 100 units.'],
['funeral-oath','Funeral Oath','death',{shieldAll:50},'A creature’s combat knockout grants living allies 50 shield.'],
['victory-fanfare','Victory Fanfare','kill',{hasteAll:2,staminaAll:10},'A knockout grants all living allies two seconds of haste and ten stamina.'],
['iron-apple','Iron Apple','flat',{hp:1.14},'Maximum HP increases by 14%.'],
['war-bead','War Bead','flat',{atk:1.12},'Attack increases by 12%.'],
['time-crystal','Time Crystal','flat',{cd:.9},'Cooldowns recharge 10% faster.'],
['swift-sol','Swift Sol','flat',{speed:1.14},'Movement speed increases by 14%.'],
['winnow-bell','Winnow Bell','flat',{enemyHP:.9},'Enemies begin battles with 10% less maximum HP.'],
['deep-breath','Deep Breath','flat',{regenStamina:1.2},'Stamina regeneration increases by 20%.'],
['adamant-pin','Adamant Pin','flat',{poise:20},'Gain twenty maximum poise.'],
['prism-plate','Prism Plate','flat',{shield:45},'Start each battle with 45 shield.'],
['healer-stone','Healer Stone','flat',{healing:1.18},'Healing is 18% stronger.'],
['keen-shard','Keen Shard','flat',{crit:.07},'Connected hits gain seven percentage points of critical chance.'],
];
const icons={route:'⌖',hit:'✶',hurt:'◒',dodge:'➶',tick:'❋',fatal:'✹',cast:'✧',channel:'⌛',heal:'✚',kill:'⚑',death:'☠',flat:'◆'};
export const EXPEDITION_RELICS=rows.map(([id,name,hook,effect,desc],i)=>({id,name,hook,effect,desc,icon:icons[hook],color:['#a6c88a','#89ccd7','#d3a4e5','#e2be7b','#eea281'][i%5],cost:95+(i%5)*20,category:hook==='flat'?'stat':hook==='route'?'expedition':'combat'}));
export const RUN_RELIC_BY_ID=Object.fromEntries(EXPEDITION_RELICS.map(d=>[d.id,d]));
export function enemyRelicPool(){return EXPEDITION_RELICS.filter(r=>!['route','death','fatal'].includes(r.hook));}
export function routeModifiers(run){const out={sight:0,warp:0};for(const id of run.relics||[]){const r=RUN_RELIC_BY_ID[id];if(r?.hook==='route')for(const [k,v]of Object.entries(r.effect))out[k]=typeof v==='number'?(out[k]||0)+v:v;}return out;}
export function relicStatFactors(ids){const o={hp:1,atk:1,speed:1,cd:1,healing:1,poise:0,shield:0,crit:0,regenStamina:1,enemyHP:1,channel:1};for(const id of new Set(ids)){const r=RUN_RELIC_BY_ID[id];if(r?.hook==='flat')for(const [k,v]of Object.entries(r.effect))['poise','shield','crit'].includes(k)?o[k]+=v:o[k]*=v;if(r?.hook==='channel')o.channel*=r.effect.factor;}return o;}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function condition(b,u,t,name){const friends=b.living(u.side).filter(a=>a!==u);return !name||name==='poison'&&t?.poison>0||name==='burn'&&t?.burn>0||name==='slow'&&t?.slow>0||name==='wounded'&&t?.hp/t?.maxHp<.3||name==='shielded'&&u.shield>0||name==='enemyShield'&&t?.shield>0||name==='alone'&&!friends.some(a=>dist(a,u)<130)||name==='nearAlly'&&friends.some(a=>dist(a,u)<130)||name==='far'&&t&&dist(u,t)>220||name==='close'&&t&&dist(u,t)<75||name==='moving'&&u.motion>.25||name==='still'&&u.motion<.08||name==='lowHP'&&u.hp/u.maxHp<.35||name==='channel'&&t?.nativeAction&&!t.nativeAction.released&&!t.nativeAction.charged||name==='castRecent'&&b.time-(u.lastRelicCast??-10)<3;}
export function compileRelics(b,u){u.runCurios=[...new Set([...(u.side?u.enemyRelics||[]:b.run.relics||[]),...(u.boundRelics||[])])].map(id=>RUN_RELIC_BY_ID[id]).filter(Boolean);u.curioStats=relicStatFactors(u.runCurios.map(r=>r.id));u.curioState={};}
export function relicDamageFactor(b,u,t,def){return (u.runCurios||[]).filter(r=>r.hook==='hit'&&(!r.effect.auto||def.auto)&&condition(b,u,t,r.effect.condition)).reduce((m,r)=>m*(r.effect.damage||1),1);}
export function relicReduction(b,u,t){return (u.runCurios||[]).filter(r=>r.hook==='hurt'&&condition(b,u,t,r.effect.condition)).reduce((m,r)=>m*(r.effect.reduction||1),1);}
function status(t,key,value,u){if(!t||t.hp<=0||['root','stagger'].includes(key)&&t.nativeAction?.charged)return;t[key]=Math.max(t[key]||0,value);if(key==='poison'||key==='burn'){t[key+'Source']=u;t[key+'Skill']=u.loadout.auto;}}
export function relicEvent(b,u,event,data={}){if(!u)return;for(const r of u.runCurios||[]){if(r.hook!==event)continue;const e=r.effect,t=data.target,st=u.curioState[r.id]??=( {count:0,last:-100} );if(!condition(b,u,t,e.condition))continue;st.count++;if(e.every&&st.count%e.every)continue;if(e.interval&&b.time-st.last<e.interval)continue;if(event==='heal'&&((e.overflow?data.excess<=0:data.real<2)||(e.refresh&&b.time-st.last<1)))continue;st.last=b.time;
 if(event==='hit'&&e.auto&&!data.def?.auto)continue;
 if(e.poison)status(event==='hurt'?data.source:t,'poison',e.poison,u);if(e.burn)status(t,'burn',e.burn,u);if(e.root&&t)status(t,'root',e.root,u);if(e.slow&&event==='cast'&&e.radius){for(const a of b.living(1-u.side).filter(a=>dist(a,u)<e.radius))status(a,'slow',e.slow,u);}else if(e.slow&&t)status(t,'slow',e.slow,u);if(e.wither)status(t,'wither',e.wither,u);if(e.exposed)status(t,'exposed',e.exposed,u);
 if(e.shred&&t)t.shield=Math.max(0,t.shield-e.shred);if(e.stun&&t)b.applyImpact(t,u,e.stun,true);if(e.stamina)u.stamina=Math.min(100,u.stamina+e.stamina);if(e.shield)u.shield=Math.min(u.maxHp*.8,u.shield+e.shield);if(e.haste)status(event==='heal'?t:u,'haste',e.haste,u);if(e.evade)status(u,'evade',e.evade,u);
 if(e.refresh)for(const cd of Object.values(u.cooldowns))cd.remaining=Math.max(0,cd.remaining-e.refresh);if(e.life&&data.dealt)b.heal(u,data.dealt*e.life,u,null,false);if(e.heal)b.heal(u,e.heal,u,null,false);if(e.healPercent)b.heal(u,u.maxHp*e.healPercent,u,null,false);
 if(e.reflect&&data.source?.hp>0)b.damageUnit(data.source,data.dealt*e.reflect,u,u.loadout.auto,0,'reflection',false);
 if(e.cleanse)b.cleanse(event==='heal'?t:u);if(e.overflow&&t)t.shield=Math.min(t.maxHp*.8,t.shield+data.excess*e.overflow);
 if(e.echo&&data.skillId){b.queue.push({ttl:e.delay,source:u,target:t,skillId:data.skillId,scale:e.echo,relicEcho:true});b.metrics.echoes++;}if(e.selfHP)b.damageUnit(u,Math.min(u.hp-1,u.maxHp*e.selfHP),u,u.loadout.auto,1,'cost',false);
 if(e.retreat){const enemy=b.living(1-u.side).sort((a,c)=>dist(a,u)-dist(c,u))[0];if(enemy){const d=dist(u,enemy)||1;u.impulseX+=(u.x-enemy.x)/d*e.retreat*5;u.impulseY+=(u.y-enemy.y)/d*e.retreat*5;}}
 const enemies=b.living(1-u.side);if(e.chain&&t){const next=enemies.filter(a=>a!==t).sort((a,c)=>dist(a,t)-dist(c,t))[0];if(next)b.hit(next,u.atk*e.chain,u,u.loadout.auto,1,false,'curio');}
 if(e.splash){const center=event==='cast'||event==='death'||event==='dodge'?u:t||u;for(const enemy of enemies.filter(a=>(center!==t||a!==t)&&dist(a,center)<e.radius))b.hit(enemy,u.atk*e.splash,u,u.loadout.auto,1,false,'curio');b.fx('ring',center.x,center.y,r.color,{r:e.radius,ttl:.4,max:.4});}
 if(event==='dodge'&&e.root)for(const enemy of enemies.filter(a=>dist(a,u)<e.radius))status(enemy,'root',e.root,u);
 if(e.thorns&&t){const enemy=enemies.sort((a,c)=>dist(a,t)-dist(c,t))[0];if(enemy)b.hit(enemy,u.atk*e.thorns,u,u.loadout.auto,1,false,'curio');}
 if(e.shieldAll||e.hasteAll||e.staminaAll)for(const a of b.living(u.side)){a.shield=Math.min(a.maxHp*.8,a.shield+(e.shieldAll||0));a.haste=Math.max(a.haste,e.hasteAll||0);a.stamina=Math.min(100,a.stamina+(e.staminaAll||0));}
 b.metrics.curioProcs=(b.metrics.curioProcs||0)+1;
 }}
export function relicFatal(b,u){const relic=u.runCurios?.find(r=>r.hook==='fatal');if(!relic||u.curioRevived)return false;u.curioRevived=true;u.hp=u.maxHp*relic.effect.revive;u.shield+=relic.effect.shield;b.effect(u.x,u.y,'ANCHOR','#d9ca92');return true;}
export function relicTick(b,u,dt){for(const r of u.runCurios||[])if(r.hook==='tick'){const st=u.curioState['timer:'+r.id]??={next:0};if(b.time>=st.next){st.next=b.time+r.effect.interval;const others=u.runCurios;u.runCurios=[r];relicEvent(b,u,'tick');u.runCurios=others;}}}
