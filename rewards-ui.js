import {artImage,UI_ART,lootArt} from './ui-art.js';
import {summaryTotals} from './battle-summary.js';

export function rewardsShell({won,gold,xp,time,claimed,loot,upgrades,growth,capture,casualty,report,continueButton,slots='',reveal=true}) {
 const totals=report?summaryTotals(report,0):{};
 return `<div class="rewards-layout ${won?'victory':'defeat'} ${claimed?'spoils-claimed':''} ${reveal?'':'rewards-revealed'}">
  <div class="rewards-landscape" aria-hidden="true"></div>
  <section class="rewards-stage" aria-label="${won?'Victory spoils':'Encounter outcome'}">
   <header class="result-hero">${artImage(won?'treasure-08':'rich-04','result-sigil')}<div><span class="section-kicker">${won?'VICTORY':'THE COST OF RETREAT'}</span><h2>${won?'A little treasure. A new possibility.':'A difficult lesson.'}</h2><div class="result-summary"><span>${artImage('treasure-04')} +${gold} gold</span><span>${artImage('icon-star')} +${xp} EXP</span><span>${artImage('rich-10')} ${Math.floor(time||0)}s</span></div></div></header>
   ${won?`<div class="reward-showcase">${loot}<div class="reward-cinematic" aria-hidden="true"><img class="reward-plinth" src="${UI_ART['reward-plinth']}" alt=""><img class="reward-rays" src="${UI_ART['reward-rays']}" alt=""><div class="reward-chest">${Array.from({length:12},(_,i)=>artImage('chest-'+String(i).padStart(2,'0'),'chest-frame frame-'+i)).join('')}</div>${artImage('reward-sparkles','reward-sparkles')}${artImage('xp-trails','experience-trails')}<div class="experience-orb">${Array.from({length:5},(_,i)=>artImage('effect-'+String(i).padStart(2,'0'),'orb-frame orb-'+i)).join('')}</div></div></div><section class="reward-upgrades"><span class="section-kicker">CHOOSE ONE UPGRADE FOR THE JOURNEY</span>${upgrades}</section>`:casualty}
  </section>
  <aside class="rewards-expedition"><header><h3>Your expedition</h3><button class="text-button" data-action="companions">Team companions →</button></header>${growth}${capture}${slots}<div class="rewards-numbers"><div><h3>The encounter, in numbers</h3><button class="text-button" data-action="report">Battle details →</button></div><div class="rewards-stat-grid">${[['damage','Damage','icon-battle'],['healed','Healing','icon-healing'],['damageMitigated','Mitigated','icon-shield'],['kills','KOs','rich-04']].map(([key,label,icon])=>`<div>${artImage(icon)}<small>${label}</small><strong>${Math.round(totals[key]||0).toLocaleString('en-US')}</strong></div>`).join('')}</div></div></aside>
  <footer class="rewards-footer"><button class="button secondary" data-action="report">${artImage('icon-help')} Why this result?</button><div>${continueButton}<small>${won&&!claimed?'Collect your spoils and choose an upgrade to continue.':''}</small></div></footer>
 </div>`;
}

export function animateRewardCollection(reducedMotion=false) {
 const stage=document.querySelector('.rewards-layout');
 if(!stage||reducedMotion)return Promise.resolve();
 stage.classList.add('collecting');
 const target=document.querySelector('.rewards-expedition h3')?.getBoundingClientRect();
 if(!target)return Promise.resolve();
 return Promise.all([...stage.querySelectorAll('.loot-drop')].map(async(card,i)=>{
  const from=card.querySelector('.loot-medallion')?.getBoundingClientRect();if(!from)return;
  const token=card.querySelector('.loot-medallion').cloneNode(true);
  token.className='reward-collect-token';
  Object.assign(token.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'});
  document.body.append(token);
  try {
   await token.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${(target.left-from.left)*.45}px,${target.top-from.top-70}px) scale(.8)`,opacity:1},{transform:`translate(${target.left-from.left}px,${target.top-from.top}px) scale(.15)`,opacity:0}],{duration:700,delay:i*90,easing:'cubic-bezier(.3,0,.6,1)'}).finished;
  } catch {} finally {token.remove();}
 }));
}

export function rewardDropHTML(d,i,{name,description,color,tier,claimed}) {
 return `<article class="loot-drop ${d.kind} ${d.rarity||''}" style="--delay:${.7+i*.13}s;--loot-color:${color}"><button class="loot-inspect" data-loot-inspect="${i}" aria-label="Inspect ${name}">${artImage('rich-08')}</button><div class="loot-medallion">${artImage(lootArt(d))}</div><small class="loot-tier">${tier}</small><strong>${name}</strong><p>${description}</p>${d.sourceName?`<small class="loot-source">From ${d.sourceName} · Lv. ${d.sourceLevel}<br>${Math.round(d.quality*100)}% item quality</small>`:''}<span class="loot-collected">${claimed?'✓ COLLECTED':'READY TO CLAIM'}</span></article>`;
}
