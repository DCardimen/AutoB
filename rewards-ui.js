import {artImage,UI_ART,lootArt} from './ui-art.js';
import {summaryTotals} from './battle-summary.js';

const reveals=new WeakMap();
const reduced=()=>document.body.classList.contains('gentle-ui')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const center=(el,fy=.5)=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height*fy,w:r.width,h:r.height};};
export function rewardArc(from,to,t,bend=90){
 if(t<=0)return {...from};if(t>=1)return {...to};const u=1-t;return {x:from.x*u+to.x*t,y:from.y*u+to.y*t-Math.sin(Math.PI*t)*bend};
}
function pulse(el,kind='pack'){
 if(!el?.isConnected||reduced())return;
 el.animate(kind==='xp'?[{boxShadow:'0 0 0 0 #d5ffc000'},{boxShadow:'0 0 22px 3px #c5fca477',offset:.25},{boxShadow:'0 0 0 0 #d5ffc000'}]:[{transform:'scale(1)'},{transform:'scale(1.12) rotate(-5deg)',offset:.3},{transform:'scale(1)'}],{duration:470,easing:'ease-out'});
}
function packFrame(pack,n){if(!pack)return;pack.dataset.frame=n;for(const [i,img]of [...pack.querySelectorAll('.pack-frame')].entries())img.style.opacity=i===n?'1':'0';}
function playPack(pack,frames,{delay=0,step=65}={}){
 return new Promise(resolve=>{const start=performance.now()+delay;function frame(now){if(!pack.isConnected){resolve();return;}if(reduced()){packFrame(pack,11);resolve();return;}const i=Math.floor((now-start)/step);if(i>=0)packFrame(pack,frames[Math.min(i,frames.length-1)]);if(i>=frames.length){resolve();return;}requestAnimationFrame(frame);}requestAnimationFrame(frame);});
}
// Sample destinations while travelling so scrolling and responsive layouts do
// not strand tokens. Animation never changes earned rewards or save data.
function fly(stage,{from,to,html,kind='gold',delay=0,duration=800,bend=90,index=0,onStart=()=>{},onArrival=()=>{}}){
 return new Promise(resolve=>{
  const token=document.createElement('div');token.className='reward-flight reward-flight-'+kind;token.setAttribute('aria-hidden','true');token.dataset.destination=kind==='xp'?'character':'knapsack';token.dataset.source=from.classList.contains('chest-mouth')?'chest':'card';if(kind==='xp')token.dataset.character=to.closest('[data-growth-uid]')?.dataset.growthUid||'';token.innerHTML=html;document.body.append(token);
  const started=performance.now()+delay;let launched=false;
  function finish(arrived){token.remove();if(arrived)onArrival();resolve();}
  function frame(now){
   if(!stage.isConnected||!from.isConnected||!to?.isConnected){finish(false);return;}
   if(reduced()){finish(true);return;}
   const age=(now-started)/duration;if(age<0){requestAnimationFrame(frame);return;}
   if(!launched){launched=true;onStart();}
   const t=Math.min(1,age),a=center(from),b=center(to),p=rewardArc(a,b,t,bend);
   const spread=Math.sin(t*Math.PI)*(index%2?-1:1)*(kind==='xp'?12:28);
   token.style.opacity=String(Math.min(1,t*12,(1-t)*10));token.style.transform=`translate(${p.x+spread}px,${p.y}px) translate(-50%,-50%) rotate(${kind==='card'?(1-t)*(index%2?16:-16):kind==='gold'?t*400:0}deg) scale(${kind==='card'?1-t*.65:Math.min(1,t*5)*(1-t*.45)})`;
   if(t>=1){finish(true);return;}requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
 });
}
// Blend adjacent authored cells at display refresh rate. Timing eases into
// the lid lift and holds the final open pose without resetting on UI updates.
export function chestFrameBlend(progress,count=12){
 const t=Math.max(0,Math.min(1,progress)),eased=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,position=eased*(count-1),from=Math.floor(position);
 return {from,to:Math.min(count-1,from+1),mix:position-from};
}
function smoothChestOpening(stage){
 const chest=stage.querySelector('.reward-chest'),frames=[...chest?.querySelectorAll('.chest-frame')||[]];if(!chest)return Promise.resolve();
 chest.dataset.smooth='true';const start=performance.now();
 return new Promise(resolve=>{function frame(now){if(!stage.isConnected){resolve();return;}const t=Math.min(1,(now-start)/1350),blend=chestFrameBlend(t,frames.length);
 frames.forEach((img,i)=>img.style.opacity=String(i===blend.to?blend.mix:i===blend.from?1-blend.mix:0));
 chest.style.transform=`translateY(${Math.sin(t*Math.PI)*-5}px) scale(${1+Math.sin(t*Math.PI)*.025})`;
 if(t<1&&!reduced())requestAnimationFrame(frame);else{frames.forEach((img,i)=>img.style.opacity=i===frames.length-1?'1':'0');chest.style.transform='';resolve();}}requestAnimationFrame(frame);});
}
function settleReveal(stage){
 stage.classList.remove('reward-reveal-pending');stage.classList.add('rewards-revealed');
 const packed=stage.querySelector('[data-packed-gold]');if(packed)packed.textContent='+'+packed.dataset.packedGold+' gold';
 packFrame(stage.querySelector('.knapsack-art'),11);
 for(const row of stage.querySelectorAll('.growth-row'))row.classList.add('xp-arrived');
}
export function animateRewardReveal(stage=document.querySelector('.rewards-layout'),{gold=0,reducedMotion=false}={}){
 if(!stage)return Promise.resolve();if(reveals.has(stage))return reveals.get(stage);
 if(!stage.classList.contains('reward-reveal-pending')||reducedMotion||reduced()){settleReveal(stage);return Promise.resolve();}
 const job=(async()=>{
  // Decode once before measuring cards. Do not wait on unrelated portraits.
  await Promise.all([...stage.querySelectorAll('.reward-chest img,.loot-drop img,.knapsack-art img')].map(img=>img.decode().catch(()=>{})));
  if(!stage.isConnected)return;
  const mouth=stage.querySelector('.chest-mouth'),pack=stage.querySelector('.knapsack-art'),destination=pack?.querySelector('.knapsack-mouth'),cards=[...stage.querySelectorAll('.loot-drop')];
  if(!mouth||!pack){settleReveal(stage);return;}
  const animations=cards.map((card,i)=>{
   const a=center(mouth),b=center(card),dx=a.x-b.x,dy=a.y-b.y;
   return card.animate([{transform:`translate(${dx}px,${dy}px) rotate(-12deg) scale(.08)`,opacity:0},{transform:`translate(${dx*.2}px,${Math.min(-35,dy*.25-75)}px) rotate(4deg) scale(1.08)`,opacity:1,offset:.68},{transform:'translate(0,0) rotate(0) scale(1)',opacity:1}],{duration:900,delay:850+i*120,easing:'cubic-bezier(.16,.7,.25,1)',fill:'both'});
  });
  const tasks=[smoothChestOpening(stage),...animations.map(a=>a.finished.catch(()=>{}))];
  if(gold>0){tasks.push(playPack(pack,[0,1,2,3,4,5,6,7],{delay:1000}));for(let i=0;i<9;i++)tasks.push(fly(stage,{from:mouth,to:destination,html:artImage('treasure-04'),kind:'gold',delay:1000+i*65,duration:900,bend:110+(i%3)*16,index:i,onArrival:()=>{pulse(pack);const counter=stage.querySelector('[data-packed-gold]');if(counter)counter.textContent='+'+Math.round(gold*(i+1)/9)+' gold';}}));}
  for(const [i,row]of [...stage.querySelectorAll('.growth-row')].entries()){
   const portrait=row.querySelector('img');if(!portrait)continue;
   tasks.push(fly(stage,{from:mouth,to:portrait,html:artImage('effect-02')+'<i></i>',kind:'xp',delay:950+i*150,duration:1000,bend:100+i*10,index:i,onArrival:()=>{row.classList.add('xp-arrived');pulse(row,'xp');}}));
  }
  await Promise.all(tasks);await playPack(pack,[8,9,10,11],{step:75});if(stage.isConnected)settleReveal(stage);animations.forEach(a=>a.cancel());
 })();reveals.set(stage,job);return job;
}
export async function animateRewardCollection(reducedMotion=false){
 const stage=document.querySelector('.rewards-layout');if(!stage)return;
 if(reducedMotion||reduced()){settleReveal(stage);stage.querySelectorAll('.loot-drop').forEach(card=>card.classList.add('card-departed'));return;}
 await reveals.get(stage);if(!stage.isConnected)return;
 stage.classList.add('collecting');const pack=stage.querySelector('.knapsack-art');if(!pack)return;
 await Promise.all([playPack(pack,[0,1,2,3,4,5,6,7],{step:50}),...[...stage.querySelectorAll('.loot-drop')].map((card,i)=>fly(stage,{from:card,to:pack.querySelector('.knapsack-mouth'),html:`<div class="flying-reward-card">${card.querySelector('.loot-medallion').outerHTML}<strong>${card.querySelector('strong').textContent}</strong></div>`,kind:'card',delay:i*110,duration:900,bend:85,index:i,onStart:()=>card.classList.add('card-departed'),onArrival:()=>{card.classList.add('card-packed');pulse(pack);}}))]);
 await playPack(pack,[8,9,10,11],{step:75});
 stage.classList.add('collection-complete');
}

export function rewardsShell({won,gold,xp,time,claimed,loot,upgrades,growth,capture,casualty,report,continueButton,collectionButton='',slots='',reveal=true}) {
 const totals=report?summaryTotals(report,0):{};
 return `<div class="rewards-layout ${won?'victory':'defeat'} ${claimed?'spoils-claimed':''} ${reveal&&!claimed&&won?'reward-reveal-pending':'rewards-revealed'}">
  <div class="rewards-landscape" aria-hidden="true"></div>
  <section class="rewards-stage" aria-label="${won?'Victory spoils':'Encounter outcome'}">
   <header class="result-hero">${artImage(won?'treasure-08':'rich-04','result-sigil')}<div><span class="section-kicker">${won?'VICTORY':'THE COST OF RETREAT'}</span><h2>${won?'A little treasure. A new possibility.':'A difficult lesson.'}</h2><div class="result-summary"><span>${artImage('treasure-04')} +${gold} gold</span><span>${artImage('icon-star')} +${xp} EXP</span><span>${artImage('rich-10')} ${Math.floor(time||0)}s</span></div></div></header>
   ${won?`<div class="reward-showcase">${loot}<div class="reward-cinematic" aria-hidden="true"><img class="reward-plinth" src="${UI_ART['reward-plinth']}" alt=""><img class="reward-rays" src="${UI_ART['reward-rays']}" alt=""><div class="reward-chest" data-smooth="true"><span class="chest-mouth"></span>${Array.from({length:12},(_,i)=>artImage('chest-'+String(i).padStart(2,'0'),'chest-frame frame-'+i)).join('')}</div><div class="mountaintop-ground"><i class="summit-rock rock-left"></i><i class="summit-rock rock-right"></i>${artImage('reward-leaves','summit-foliage foliage-left')}${artImage('reward-leaves','summit-foliage foliage-right')}<span class="summit-mist"></span></div>${artImage('reward-sparkles','reward-sparkles')}</div></div><section class="reward-upgrades"><span class="section-kicker">CHOOSE ONE UPGRADE FOR THE JOURNEY</span>${upgrades}</section>`:casualty+loot}
  </section>
  <aside class="rewards-expedition"><header><h3>Your expedition</h3><button class="text-button" data-action="companions">Team companions →</button></header>${growth}${capture}${slots}<div class="rewards-numbers"><div><h3>The encounter, in numbers</h3><button class="text-button" data-action="report">Battle details →</button></div><div class="rewards-stat-grid">${[['damage','Damage','icon-battle'],['healed','Healing','icon-healing'],['damageMitigated','Mitigated','icon-shield'],['kills','KOs','rich-04']].map(([key,label,icon])=>`<div>${artImage(icon)}<small>${label}</small><strong>${Math.round(totals[key]||0).toLocaleString('en-US')}</strong></div>`).join('')}</div></div></aside>
  <footer class="rewards-footer"><button class="button secondary" data-action="report">${artImage('icon-help')} Why this result?</button>${won||loot?`<div class="reward-knapsack" data-reward-pack aria-label="Knapsack: gold and reward cards"><div class="knapsack-art">${Array.from({length:12},(_,i)=>artImage('pack-'+String(i).padStart(2,'0'),'pack-frame pack-'+i)).join('')}<span class="knapsack-mouth"></span><i class="pack-arrival-ring"></i></div><span><strong>Knapsack <b data-packed-gold="${gold}">+${reveal&&!claimed?0:gold} gold</b></strong><small>${claimed?'Spoils safely packed':'Gold & cards belong here'}</small></span></div>`:''}<div>${collectionButton}${continueButton}<small>${(won||loot)&&!claimed?(won?'Collect your spoils and choose an upgrade to continue.':'Collect the equipment recovered from your capture.'):''}</small></div></footer>
 </div>`;
}

export function rewardDropHTML(d,i,{name,description,color,tier,claimed}) {
 return `<article data-from-capture="${!!d.fromCapture}" class="loot-drop ${d.kind} ${d.rarity||''}" style="--delay:${.7+i*.13}s;--loot-color:${color}"><button class="loot-inspect" data-loot-inspect="${i}" aria-label="Inspect ${name}">${artImage('rich-08')}</button><div class="loot-medallion">${artImage(lootArt(d))}</div><small class="loot-tier">${tier}</small><strong>${name}</strong><p>${description}</p>${d.sourceName?`<small class="loot-source">${d.fromCapture?'FROM CAPTURE':'From'} ${d.sourceName} · Lv. ${d.sourceLevel}<br>${d.kind==='gear'?Math.round(d.quality*100)+'% item quality':'Aura Stone recovered'}</small>`:''}<span class="loot-collected">${claimed?'✓ COLLECTED':'READY TO CLAIM'}</span></article>`;
}
