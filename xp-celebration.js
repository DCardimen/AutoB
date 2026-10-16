import {xpNeeded} from './game.js';

const jobs=new WeakMap();
const gentle=()=>document.body.classList.contains('gentle-ui')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=v=>Math.max(0,Math.min(1,v));
export function experiencePlan(g){
 let level=g.before.level,xp=g.before.xp,left=Math.max(0,g.amount),earned=0;const segments=[];
 for(let i=0;left>0&&i<100;i++){const needed=level===g.before.level?g.before.needed:xpNeeded(level),gain=Math.min(left,Math.max(0,needed-xp));if(needed<=0)break;segments.push({level,from:xp,to:xp+gain,needed,earned,gain,levelUp:xp+gain>=needed});left-=gain;earned+=gain;if(xp+gain<needed)break;level++;xp=0;}
 const travel=Math.min(3800,1150+Math.max(0,segments.length-1)*450),weight=segments.reduce((n,s)=>n+Math.max(.3,s.gain/s.needed),0)||1;let cursor=0;
 for(const s of segments){s.start=cursor;s.duration=travel*Math.max(.3,s.gain/s.needed)/weight;cursor+=s.duration;s.hold=s.levelUp?260:0;cursor+=s.hold;s.end=cursor;}
 return {segments,duration:cursor,before:g.before,after:g.after,amount:g.amount};
}
export function experienceFrame(plan,elapsed){
 if(elapsed>=plan.duration||!plan.segments.length)return {...plan.after,earned:plan.amount,progress:clamp(plan.after.xp/plan.after.needed),phase:'done'};
 const s=plan.segments.find(s=>elapsed<s.end)||plan.segments.at(-1),t=clamp((elapsed-s.start)/s.duration),ease=1-(1-t)**3,xp=s.from+(s.to-s.from)*ease;
 return {level:s.level,xp,needed:s.needed,earned:s.earned+s.gain*ease,progress:clamp(xp/s.needed),phase:t>=1&&s.levelUp?'levelup':'fill',levelUp:t>=1&&s.levelUp?s.level+1:null};
}
function data(row){const n=name=>Number(row.dataset[name]);return {before:{level:n('xpBeforeLevel'),xp:n('xpBefore'),needed:n('xpBeforeNeeded')},after:{level:n('xpAfterLevel'),xp:n('xpAfter'),needed:n('xpAfterNeeded')},amount:n('xpAmount')};}
function paint(row,state){
 const fill=row.querySelector('.xp-fill'),track=row.querySelector('[data-xp-track]');if(fill)fill.style.width=(state.progress*100)+'%';if(track){track.setAttribute('aria-valuenow',String(Math.round(state.xp)));track.setAttribute('aria-valuemax',String(state.needed));track.setAttribute('aria-valuetext',`Level ${state.level}: ${Math.round(state.xp)} of ${state.needed} EXP`);}
 const level=row.querySelector('[data-xp-level]'),readout=row.querySelector('[data-xp-readout]'),earned=row.querySelector('[data-xp-earned]');if(level)level.textContent='Lv. '+(state.levelUp||state.level);if(readout)readout.textContent=Math.round(state.xp)+' / '+state.needed+' EXP';if(earned)earned.textContent='+'+Math.round(state.earned)+' EXP '+(state.phase==='done'?'earned':'absorbed');row.dataset.xpPhase=state.phase;row.classList.toggle('xp-complete',state.phase==='done');
}
export function settleExperience(row){paint(row,experienceFrame(experiencePlan(data(row)),Infinity));row.classList.add('xp-arrived');row.classList.remove('xp-charging');}
export function prepareExperience(root){for(const row of root.querySelectorAll('[data-xp-amount]')){const g=data(row);paint(row,{...g.before,earned:0,progress:clamp(g.before.xp/g.before.needed),phase:'waiting'});}}
function burst(row,level){
 if(gentle())return;const effect=document.createElement('div');effect.className='xp-level-burst';effect.setAttribute('aria-hidden','true');effect.innerHTML=`<b>LEVEL UP <em>Lv. ${level}</em></b>`+Array.from({length:14},(_,i)=>{const a=i*Math.PI*2/14;return `<i style="--spark-x:${Math.cos(a)*(35+i%3*10)}px;--spark-y:${Math.sin(a)*30}px;--spark-delay:${i%3*30}ms"></i>`;}).join('');row.append(effect);row.dataset.xpBursts=String((Number(row.dataset.xpBursts)||0)+1);row.animate([{boxShadow:'inset 0 0 0 #ffeab000',transform:'scale(1)'},{boxShadow:'inset 0 0 25px #ffeab055',transform:'scale(1.025)',offset:.3},{boxShadow:'inset 0 0 0 #ffeab000',transform:'scale(1)'}],{duration:550,easing:'cubic-bezier(.2,.7,.3,1)'});setTimeout(()=>effect.remove(),850);document.dispatchEvent(new CustomEvent('companion-level-up',{detail:{uid:row.dataset.growthUid,level}}));
}
function rootFor(row){return row.closest('.rewards-layout')||row.closest('.recap-growth');}
export function syncExperience(root){const state=jobs.get(root);if(!state)return;for(const row of root.querySelectorAll('[data-xp-amount]')){const job=state.get(row.dataset.growthUid);if(job?.frame)paint(row,job.frame);}}
export function animateExperience(row,{force=false,reducedMotion=false}={}){
 if(!row?.isConnected)return Promise.resolve();const root=rootFor(row),uid=row.dataset.growthUid;let state=jobs.get(root);if(!state){state=new Map();jobs.set(root,state);}const old=state.get(uid);if(old&&!force)return old.promise;if(old)old.cancel?.();
 if(reducedMotion||gentle()){const promise=Promise.resolve();state.set(uid,{promise,frame:experienceFrame(experiencePlan(data(row)),Infinity)});settleExperience(row);return promise;}
 const plan=experiencePlan(data(row)),job={frame:null};state.set(uid,job);const start=performance.now(),seen=new Set();row.classList.add('xp-charging','xp-arrived');row.dataset.xpBursts='0';let raf;
 job.promise=new Promise(resolve=>{job.cancel=()=>{cancelAnimationFrame(raf);resolve();};function tick(now){if(!root.isConnected){resolve();return;}const live=[...root.querySelectorAll('[data-growth-uid]')].find(r=>r.dataset.growthUid===uid);if(!live){resolve();return;}if(gentle()){job.frame=experienceFrame(plan,Infinity);settleExperience(live);resolve();return;}const frame=experienceFrame(plan,now-start);job.frame=frame;paint(live,frame);if(frame.levelUp&&!seen.has(frame.levelUp)){seen.add(frame.levelUp);burst(live,frame.levelUp);}if(frame.phase==='done'){live.classList.remove('xp-charging');resolve();return;}raf=requestAnimationFrame(tick);}raf=requestAnimationFrame(tick);});return job.promise;
}
if(typeof document!=='undefined')document.addEventListener('click',e=>{const replay=e.target.closest('[data-replay-experience]');if(!replay)return;const root=replay.closest('.recap-growth');if(!root)return;for(const row of root.querySelectorAll('[data-xp-amount]'))animateExperience(row,{force:true});});
