// Reviewed against the four uploaded relic sheets. Shared illustrations denote
// shared mechanics, never catalog position; new entries cannot shuffle old art.
const curated={
 fangs:'relic-4-22',clock:'relic-4-20',seed:'relic-1-07',prism:'relic-2-12',lens:'relic-2-21',banner:'relic-2-03',feather:'relic-1-12',coin:'treasure-01',bond:'relic-4-18',
 'blood-pact':'relic-1-23',mercy:'relic-1-14','storm-relay':'relic-4-04','thorn-crown':'relic-3-17','glass-cannon':'relic-3-05','spore-network':'relic-1-02','execution-bell':'relic-4-05',sanctuary:'relic-3-14',overgrowth:'relic-1-20',hatchery:'relic-1-15',salvage:'relic-4-00',unity:'relic-3-13','last-light':'relic-2-22',frostfire:'relic-2-24','echo-chamber':'relic-2-11',
 'star-chart':'relic-3-11','oracle-lens':'relic-2-21','atlas-of-echoes':'relic-4-10','veil-corridor':'relic-3-22','pilgrim-thread':'relic-4-18','battle-compass':'relic-4-00','merchant-seal':'relic-4-14','empty-purse':'relic-2-15','guild-charter':'relic-4-19','rift-map':'relic-3-08','prism-nest':'relic-1-15','cage-smith':'relic-1-04','patient-loom':'relic-4-18','silken-hook':'relic-2-23','returning-prism':'relic-2-12','beast-ledger':'relic-4-23','nursery-bell':'relic-4-05','treasure-moth':'relic-2-13','contract-ink':'relic-2-23','royal-stables':'relic-4-21',
 'venom-clasp':'relic-4-06','ember-script':'relic-1-03','thorn-cuff':'relic-1-20','winter-talon':'animal-02','fracture-nail':'relic-3-05','copper-conductor':'relic-4-04','serpent-contract':'relic-4-06','charcoal-mirror':'relic-4-02','shatter-oath':'relic-3-05','execution-script':'relic-4-11','dawn-cord':'relic-1-08','duelist-knot':'relic-4-18','pack-standard':'relic-2-03','sniper-script':'relic-2-21','pit-fighter-chain':'relic-3-22','blood-signet':'accessory-11','fervor-spindle':'relic-4-18','guardbreaker':'relic-2-09','momentum-band':'relic-3-03','stamina-spike':'relic-1-00','recharge-tooth':'relic-4-22','splash-rune':'relic-3-02','black-salt':'relic-4-06','hunter-eye':'relic-3-12','storm-suture':'relic-4-18','spellblade-thread':'relic-4-18','ashen-needle':'relic-2-23','venom-hourglass':'relic-4-20','pressure-crown':'relic-3-17','interruption-hook':'relic-2-23',
 'clockwork-orchard':'relic-2-20','pilgrims-debt':'relic-4-14','borrowed-tomorrow':'relic-2-20','weather-vane-covenant':'relic-4-23','last-lantern':'relic-2-22','hollow-reed':'relic-1-10','triune-crucible':'relic-2-24','second-dawn-thread':'relic-4-18',
 'chrono-throne':'relic-4-20','phoenix-covenant':'relic-2-22','cataclysm-heart':'relic-3-00','endless-banquet':'relic-1-19','sovereigns-seat':'relic-4-07','polite-pebble':'relic-3-10','slightly-warm-sock':'relic-1-18','dented-button':'relic-3-03','emergency-napkin':'relic-2-09','patient-moss':'relic-1-06',
 'scorch-fang':'animal-03','ward-stone':'relic-2-00','quick-shard':'relic-2-20',moonstone:'relic-3-10',windglass:'relic-3-09',heartseed:'relic-1-07','hunters-eye':'relic-2-21',ironbark:'relic-1-20','spore-ring':'accessory-19','echo-prism':'relic-2-16','phoenix-ash':'relic-2-22','wanderers-knot':'relic-4-18','fracture-gem':'relic-3-05','fork-gem':'relic-4-04','frost-gem':'animal-02','venom-gem':'relic-4-06','cleanse-gem':'relic-4-05','reservoir-gem':'relic-1-19','beacon-gem':'relic-2-22','hex-gem':'relic-3-17','execute-gem':'relic-3-23','trap-gem':'relic-1-18','siphon-gem':'relic-4-02','expose-gem':'relic-2-21','blood-gem':'relic-4-20','relay-gem':'relic-4-04','detonate-gem':'relic-3-00','bodyguard-gem':'relic-2-00','recoil-gem':'relic-3-14','renewal-gem':'relic-3-02',
 'worn-heartstone':'relic-1-07','chipped-fang':'animal-04','faded-feather':'relic-1-12','cracked-prism':'relic-2-12','tarnished-hourglass':'relic-4-20',
};
export function relicIllustration(relic){
 if(relic.aura&&relic.art)return relic.art;
 if(relic.art||curated[relic.id])return relic.art||curated[relic.id];
 const id=relic.id,e=relic.effect||{};
 if(/bell|fanfare|recital|voice/.test(id))return 'relic-4-05';
 if(/clock|hour|quickglass|time|tomorrow/.test(id))return 'relic-4-20';
 if(/lantern|light/.test(id))return 'relic-2-22';
 if(/crown|throne|command/.test(id))return 'relic-2-03';
 if(/mirror/.test(id)||e.reflect)return 'relic-4-02';
 if(/moss|flower|pollen|nectar|seed|garden/.test(id))return 'relic-1-06';
 if(/spore/.test(id))return 'relic-1-02';
 if(/lung|breath/.test(id)||e.regenStamina)return 'relic-1-00';
 if(/eye|lens|longshot|chart/.test(id))return 'relic-2-21';
 if(/map|compass/.test(id))return 'relic-4-00';
 if(/ribbon|thread|knot|suture|spindle/.test(id))return 'relic-4-18';
 if(e.poison||e.poisonBurst||/serpent|venom/.test(id))return 'relic-4-06';
 if(e.burn||e.burnDetonate||/ember|furnace|kindling/.test(id))return 'relic-3-00';
 if(e.slow||e.root||/frost|winter|bramble/.test(id))return 'relic-3-02';
 if(e.life||e.bleed||/blood/.test(id))return 'relic-3-06';
 if(e.chain||e.stamina||/storm|battery/.test(id))return 'relic-4-04';
 if(e.shield||e.shieldAll||e.shieldPercent||e.armor||/aegis|bastion|shell|plate|adamant/.test(id))return 'relic-2-00';
 if(e.heal||e.healing||e.healLowest||e.healPercent||e.overflow||relic.hook==='heal')return 'relic-1-14';
 if(e.revive||relic.hook==='fatal'||relic.hook==='death')return 'relic-3-19';
 if(e.speed||e.evade||e.dashCooldown||relic.hook==='dodge')return 'relic-3-09';
 if(e.attackSpeed||e.actionSpeed)return 'relic-2-20';
 if(e.hp||/heart|apple/.test(id))return 'relic-1-07';
 if(e.echo||/echo/.test(id))return 'relic-2-16';
 if(e.atk||e.damage||relic.hook==='hit'||relic.hook==='kill')return 'relic-4-22';
 return relic.hook==='ai'?'relic-4-00':'relic-3-24';
}
