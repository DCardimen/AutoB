import {artImage,relicArt} from './ui-art.js';
import {illuminatedEffect} from './relic-ui.js';

export function openingRelicHTML(offer,catalog,describe){
 return `<div class="opening-relic-layout"><span class="section-kicker">YOUR FIRST RELIC · ${offer.lesser?'LESSER BLESSINGS':'TWO POSSIBILITIES'}</span><h2>A blessing for the road.</h2><p>${offer.lesser?'Your last expedition ended before three arena wins. These smaller blessings can help you begin again. Win three arena battles to restore the full opening choice.':'Your team is ready. Choose one of these two relics to carry through the expedition.'}</p><div class="opening-relic-choices">${offer.choices.map(id=>{const r=catalog.find(r=>r.id===id);return `<button class="opening-relic-card ${r.majorPact?'major-pact':''}" data-opening-relic="${id}">${artImage(relicArt(id),'opening-relic-art')}<small>${r.majorPact?'GREAT POWER · GREAT PRICE':offer.lesser?'LESSER BLESSING':'EXPEDITION RELIC'}</small><strong>${r.name}</strong><span class="opening-relic-effect">${illuminatedEffect(describe(r))}</span><span class="relic-take-label">Receive relic →</span></button>`;}).join('')}</div><p class="relic-choice-note">One relic, or none. This choice is optional.</p><button class="button secondary" data-action="skip-opening-relic">Begin without a relic →</button></div>`;
}

// The game grants and saves first. This effect never mutates inventory.
export async function animateRelicReceived(id,from,{reducedMotion=false}={}){
 const target=document.querySelector(`[data-relic-preview="${id}"]`);
 if(!target)return;
 document.dispatchEvent(new CustomEvent('relic-received',{detail:{id}}));
 target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
 if(reducedMotion||document.hidden){target.classList.add('relic-just-received');return;}
 const sprite=document.createElement('div');sprite.className='relic-receive-flight';sprite.dataset.relicReceived=id;sprite.setAttribute('aria-hidden','true');sprite.innerHTML=artImage(relicArt(id))+Array.from({length:12},(_,i)=>`<i style="--spark:${i}"></i>`).join('');document.body.append(sprite);
 const start=from||{left:innerWidth/2-50,top:innerHeight/2-50,width:100,height:100};
 const sx=start.left+start.width/2,sy=start.top+start.height/2,size=Math.max(56,Math.min(128,start.width));
 sprite.style.width=sprite.style.height=size+'px';
 try{await sprite.querySelector('img')?.decode();}catch{}
 await new Promise(resolve=>{
  let began;
  function frame(now){
   began??=now;const t=Math.min(1,(now-began)/1150);
   if(!target.isConnected||document.hidden){resolve();return;}
   const rect=target.getBoundingClientRect(),p=1-Math.pow(1-t,3),x=sx+(rect.left+rect.width/2-sx)*p,y=sy+(rect.top+rect.height/2-sy)*p-Math.sin(p*Math.PI)*Math.min(150,innerHeight*.18),scale=1+Math.sin(t*Math.PI)*.18-t*(1-rect.width/size);
   sprite.style.transform=`translate3d(${x-size/2}px,${y-size/2}px,0) scale(${scale}) rotate(${Math.sin(t*Math.PI)*12}deg)`;sprite.style.opacity=String(t>.92?(1-t)/.08:1);
   if(t<1)requestAnimationFrame(frame);else resolve();
  }
  requestAnimationFrame(frame);
 });
 sprite.remove();if(target.isConnected){target.classList.add('relic-just-received');setTimeout(()=>target.classList.remove('relic-just-received'),1400);}
}
