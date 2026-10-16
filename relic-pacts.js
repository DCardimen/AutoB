// Tradeoffs are real team stats, compiled through the same combat rules as gear.
// Catalog values use the established 50% item-strength convention.
const rows=[
 ['bloodglass-crown','Bloodglass Crown','flat',{atk:2.2,hp:.4},null,'relic-3-17'],
 ['ironroot-idol','Ironroot Idol','flat',{hp:2.4,speed:.3},null,'relic-1-20'],
 ['captive-hourglass','Captive Hourglass','flat',{cd:.2,atk:.4},null,'relic-4-20'],
 ['giants-fetter','Giant’s Fetter','flat',{atk:2.1,speed:.2},null,'relic-3-22'],
 ['hollow-sanctuary','Hollow Sanctuary','flat',{healing:2.4,atk:.2},null,'relic-3-14'],
 ['shattered-citadel','Shattered Citadel','flat',{shield:240,hp:.4},null,'relic-2-00'],
 ['fevered-wing','Fevered Wing','flat',{attackSpeed:2.2,hp:.3},null,'relic-3-09'],
 ['restless-moon','Restless Moon','flat',{speed:2,dashCooldown:.3,cd:1.8},null,'relic-1-17'],
 ['venomous-diadem','Venomous Diadem','hit',{poison:8},{hp:.4},'relic-3-17'],
 ['ashen-heart','Ashen Heart','hit',{burn:8},{healing:.2},'relic-3-00'],
 ['vampires-vow','Vampire’s Vow','hit',{life:.6},{hp:.3},'relic-1-23'],
 ['mirror-of-thorns','Mirror of Thorns','hurt',{reflect:.7},{cd:1.8},'relic-4-02'],
 ['burdened-aegis','Burdened Aegis','cast',{shieldAll:80,interval:5},{speed:.2},'relic-3-22'],
 ['waning-veil','Waning Veil','dodge',{evade:6,interval:5},{atk:.3},'relic-2-13'],
 ['starved-comet','Starved Comet','hit',{every:3,chain:1.6},{regenStamina:.2},'relic-3-05'],
];
export const PACT_RELICS=rows.map(([id,name,hook,effect,statEffect,art])=>({id,name,hook,effect,statEffect,art,majorPact:true,icon:'✦',color:'#df9c89',cost:280,category:'pact'}));
