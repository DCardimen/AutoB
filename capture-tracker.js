import {captureChance,stats,creatureName} from './game.js';
import {CAPTURERS} from './expedition-rules.js';

const clamp=n=>Math.max(0,Math.min(1,n));
export function captureTrackerState(run,foes,phase,battle=null){
 if(!['prep','battle'].includes(phase))return null;
 const live=phase==='battle'&&battle,plan=live?battle.capturePlan||run.captureOrder:run.captureOrder;
 if(!plan)return null;
 const target=(live?battle.units:foes)?.find(c=>c.uid===plan.uid);
 if(!target||target.boss)return null;
 const maxHp=live?target.maxHp:stats(target,foes,target.enemyRelics||[]).hp,hp=live?Math.max(0,target.hp):maxHp,fraction=clamp(hp/Math.max(1,maxHp)),threshold=clamp(plan.threshold??.25);
 const result=live&&battle.captureResult?.uid===target.uid?battle.captureResult:null;
 const tool=result&&!result.success?(run.selectedCapturer||plan.tool||'scout'):(plan.tool||run.selectedCapturer||'scout');
 const chance=captureChance(live?battle.run:run,{...target,capturePreparation:{healthFraction:fraction,status:['burn','poison','root','slow','bleed'].some(k=>target[k]>0),mode:plan.mode||'mercy',tool}});
 const status=result?.success?'Captured!':hp<=0?'Knocked out before capture':live&&battle.captureScene?'Lattice in flight':result?'Attempt failed':fraction<=threshold?'Capture threshold reached':live?'Weakening target':'Capture planned';
 return {uid:target.uid,name:creatureName(target),id:target.id,hp,maxHp,fraction,threshold,progress:result?.success?1:clamp((1-fraction)/Math.max(.01,1-threshold)),chance:result?.success?result.chance:chance,chanceLabel:result?.success?'Chance at throw':'Current capture chance',tool,toolName:CAPTURERS[tool]?.name||tool,status,success:!!result?.success,failed:!!result&&!result.success,live:!!live,canRetry:!!live&&!!result&&!result.success&&!battle.captureScene&&battle.captureAttempts<3&&hp>0,canClear:phase==='prep'&&!run.captureReservation,attempts:live?battle.captureAttempts||0:0,target};
}

export function captureTrackerHTML(collapsed=false){
 return `<aside id="capture-tracker" class="capture-tracker ${collapsed?'collapsed':''}" aria-label="Capture target status" hidden><header><span class="capture-tracker-portrait"></span><div><small>CAPTURE TARGET</small><strong data-capture-name></strong></div><button data-action="capture-kit" aria-label="Adjust capture tools" title="Adjust capture tools">&#8943;</button><button data-capture-retry aria-label="Retry capture" hidden>Retry</button><button data-action="capture-tracker-toggle" aria-label="Toggle capture details" aria-expanded="${!collapsed}" aria-controls="capture-tracker-body">⌄</button><button data-action="clear-capture" aria-label="Cancel capture plan" title="Cancel capture plan">×</button></header><div id="capture-tracker-body"><div class="capture-tracker-vitals"><span>HP <b data-capture-hp></b></span><strong data-capture-percent></strong></div><div class="capture-tracker-health" role="progressbar" aria-label="Target health" aria-valuemin="0" aria-valuemax="100"><i></i><span data-capture-marker></span></div><div class="capture-tracker-odds"><span data-capture-chance-label>Current capture chance</span><strong data-capture-chance></strong></div><div class="capture-tracker-progress"><i></i></div><p data-capture-distance></p><footer><span data-capture-tool></span><button data-action="capture-kit">Adjust →</button></footer><p class="capture-tracker-status" role="status" aria-live="polite" data-capture-status></p></div></aside>`;
}

export function updateCaptureTracker(root,state,image){
 if(!root)return;
 root.hidden=!state;if(!state)return;
 root.dataset.captureUid=state.uid;root.classList.toggle('captured',state.success);root.classList.toggle('failed',state.failed);
 const text=(selector,value)=>{const el=root.querySelector(selector);if(el.textContent!==value)el.textContent=value;};
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
