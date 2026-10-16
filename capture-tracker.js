import {captureChance,stats,creatureName,BY_ID,RARITY} from './game.js';
import {CAPTURERS} from './expedition-rules.js';

import {armorReduction} from './creature-equipment.js';

const clamp=n=>Math.max(0,Math.min(1,n));
// Approximate one coordinated basic-attack volley, not a simulated battle outcome.
// Specials, critical hits, travel time and damage over time can change the result.
export function focusKnockoutRisk(allies,target,healthFraction,mode='mercy'){
 const volley=allies.filter(c=>c.hp>0).reduce((sum,c)=>sum+Math.max(0,c.atk||0)*(c.weakened>0?.75:1)*(c.rage>0?1.18:1),0)*(mode==='swift'?.94:.86);
 if(!volley)return 0;
 const reduction=armorReduction((target.armor||0)+(target.armorBuffTime>0?target.armorBuff||0:0),target.role||BY_ID[target.id]?.role);
 const damage=volley*(1-reduction)*(target.fortify>0?.88:1)*(target.exposed>0?1.18:1);
 const durability=Math.max(0,target.maxHp*healthFraction)+Math.max(0,target.shield||0);
 return Math.max(.01,Math.min(.99,1/(1+Math.exp((durability/Math.max(.01,damage)-1)/.35))));
}
export function captureTrackerState(run,foes,phase,battle=null,preview=null){
 if(!['prep','battle'].includes(phase))return null;
 const live=phase==='battle'&&battle,plan=live?battle.capturePlan||run.captureOrder:run.captureOrder;
 if(!plan)return null;
 const target=(live?battle.units:foes)?.find(c=>c.uid===plan.uid);
 if(!target||target.boss)return null;
 const combatTarget=(live?target:preview?.units.find(c=>c.uid===target.uid))||{...target,...stats({...target,balanceVersion:run.rulesVersion},foes,target.enemyRelics||[])};
 const maxHp=combatTarget.maxHp??combatTarget.hp,hp=live?Math.max(0,target.hp):maxHp,fraction=clamp(hp/Math.max(1,maxHp)),threshold=clamp(plan.threshold??.25);
 const result=live&&battle.captureResult?.uid===target.uid?battle.captureResult:null;
 const tool=result&&!result.success?(run.selectedCapturer||plan.tool||'scout'):(plan.tool||run.selectedCapturer||'scout');
 const chance=captureChance(live?battle.run:run,{...target,capturePreparation:{healthFraction:fraction,status:['burn','poison','root','slow','bleed'].some(k=>target[k]>0),mode:plan.mode||'mercy',tool}});
 const thresholdChance=captureChance(live?battle.run:run,{...target,capturePreparation:{healthFraction:threshold,status:['burn','poison','root','slow','bleed'].some(k=>target[k]>0),mode:plan.mode||'mercy',tool}});
 const allies=(live?battle.units:preview?.units)?.filter(c=>c.side===0)||run.team.map(c=>({...c,...stats({...c,balanceVersion:run.rulesVersion},run.team,run.relics)}));
 const riskFraction=live?Math.min(fraction,threshold):threshold,knockoutRisk=focusKnockoutRisk(allies,{...combatTarget,maxHp},riskFraction,plan.mode);
 const rarity=BY_ID[target.id].rarity;
 const status=result?.success?'Captured!':hp<=0?'Knocked out before capture':live&&battle.captureScene?'Lattice in flight':result?'Attempt failed':fraction<=threshold?'Capture threshold reached':live?'Weakening target':'Capture planned';
 return {rarity,rarityColor:RARITY[rarity].color,thresholdChance,knockoutRisk,riskFraction,uid:target.uid,name:creatureName(target),id:target.id,hp,maxHp,fraction,threshold,progress:result?.success?1:clamp((1-fraction)/Math.max(.01,1-threshold)),chance:result?.success?result.chance:chance,chanceLabel:result?.success?'Chance at throw':'Current capture chance',tool,toolName:CAPTURERS[tool]?.name||tool,status,success:!!result?.success,failed:!!result&&!result.success,live:!!live,canRetry:!!live&&!!result&&!result.success&&!battle.captureScene&&battle.captureAttempts<3&&hp>0,canClear:phase==='prep'&&!run.captureReservation,attempts:live?battle.captureAttempts||0:0,target};
}

export function captureTrackerHTML(collapsed=false){
 return `<aside id="capture-tracker" class="capture-tracker ${collapsed?'collapsed':''}" aria-label="Capture target status" hidden><header><span class="capture-tracker-portrait"></span><div><small>CAPTURE TARGET <b data-capture-rarity></b></small><strong data-capture-name></strong></div><button data-action="capture-kit" aria-label="Adjust capture tools" title="Adjust capture tools">&#8943;</button><button data-capture-retry aria-label="Retry capture" hidden>Retry</button><button data-action="capture-tracker-toggle" aria-label="Toggle capture details" aria-expanded="${!collapsed}" aria-controls="capture-tracker-body">⌄</button><button data-action="clear-capture" aria-label="Cancel capture plan" title="Cancel capture plan">×</button></header><div id="capture-tracker-body"><div class="capture-tracker-vitals"><span>HP <b data-capture-hp></b></span><strong data-capture-percent></strong></div><div class="capture-tracker-health" role="progressbar" aria-label="Target health" aria-valuemin="0" aria-valuemax="100"><i></i><span data-capture-marker></span></div><div class="capture-tracker-odds"><span data-capture-chance-label>Current capture chance</span><strong data-capture-chance></strong></div><div class="capture-tracker-progress"><i></i></div><div class="capture-tracker-forecast"><span data-capture-threshold-label></span><strong data-capture-threshold-chance></strong><span data-capture-risk-label></span><strong data-capture-risk></strong></div><p data-capture-distance></p><footer><span data-capture-tool></span><button data-action="capture-kit">Adjust →</button></footer><p class="capture-tracker-status" role="status" aria-live="polite" data-capture-status></p></div></aside>`;
}

export function updateCaptureTracker(root,state,image){
 if(!root)return;
 root.hidden=!state;if(!state)return;
 root.dataset.captureUid=state.uid;root.classList.toggle('captured',state.success);root.classList.toggle('failed',state.failed);
 const text=(selector,value)=>{const el=root.querySelector(selector);if(el.textContent!==value)el.textContent=value;};
 text('[data-capture-rarity]',state.rarity);root.style.setProperty('--capture-rarity',state.rarityColor);
 text('[data-capture-threshold-label]',`Capture at ${Math.round(state.threshold*100)}% HP`);text('[data-capture-threshold-chance]',`${Math.round(state.thresholdChance*100)}%`);
 text('[data-capture-risk-label]',`All-focus KO at ${Math.round(state.riskFraction*100)}% HP (est.)`);text('[data-capture-risk]',state.success||state.hp<=0?'\u2014':`~${Math.round(state.knockoutRisk*100)}%`);
 root.querySelector('[data-capture-risk]').title='Estimated chance of knocking out the target before capture if every living ally lands a basic attack together. Includes armor, shields and Mercy/Swift. Specials, critical hits, timing and damage over time vary.';
 root.querySelector('[data-capture-risk-label]').title='All allies focusing together (estimate)';
 const portrait=root.querySelector('.capture-tracker-portrait');
 if(portrait.dataset.uid!==state.uid){portrait.innerHTML=image(state.target);portrait.dataset.uid=state.uid;}
 text('[data-capture-name]',state.name);text('[data-capture-hp]',`${Math.ceil(state.hp)} / ${Math.round(state.maxHp)}`);text('[data-capture-percent]',`${(state.fraction*100).toFixed(1)}%`);
 text('[data-capture-chance-label]',state.chanceLabel);text('[data-capture-chance]',`${Math.round(state.chance*100)}%`);text('[data-capture-tool]',state.toolName);
 text('[data-capture-distance]',state.success?'Joined your expedition':state.fraction>state.threshold?`${((state.fraction-state.threshold)*100).toFixed(1)} HP points to ${Math.round(state.threshold*100)}% threshold`:`Auto-throw at ${Math.round(state.threshold*100)}% HP`);
 text('[data-capture-status]',state.status+(state.attempts?` · Attempt ${state.attempts} / 3`:''));
 const retry=root.querySelector('[data-capture-retry]');retry.dataset.enemyCapture=state.uid;retry.hidden=!state.canRetry;
 const health=root.querySelector('.capture-tracker-health');health.setAttribute('aria-valuenow',(state.fraction*100).toFixed(1));health.querySelector('i').style.width=state.fraction*100+'%';root.querySelector('[data-capture-marker]').style.left=state.threshold*100+'%';root.querySelector('.capture-tracker-progress i').style.width=state.progress*100+'%';
 root.querySelector('[data-action="clear-capture"]').hidden=!state.canClear;
 root.querySelector('[data-action="capture-kit"]').title=state.toolName+' — adjust capture tools';
}
