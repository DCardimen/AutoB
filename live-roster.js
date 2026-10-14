import {relicBuildSummary} from './relic-design.js';
import {BY_ID,creatureName} from './game.js';
import {SKILLS} from './skills.js';
import {activeAilments} from './status-ailments.js';

const percent=(value,total)=>Math.max(0,Math.min(100,value/Math.max(1,total)*100));

// Membership changes rebuild the strip; combat values update existing nodes so
// keyboard focus and the player's horizontal scroll position remain stable.
export function updateLiveRoster(root,battle,{side=0,selectedUid=null,image,paired=false,controls=null}){
  if(!root||!battle)return;
  if(paired){
    if(!root.classList.contains('paired-rosters')){root.classList.add('paired-rosters');root.innerHTML='<section data-roster-panel="0" aria-label="Your team"></section><section data-roster-panel="1" aria-label="Opponents"></section>';}
    for(const panel of root.children)updateLiveRoster(panel,battle,{side:Number(panel.dataset.rosterPanel),selectedUid,image,controls});
    return;
  }
  const units=battle.units.filter(u=>u.side===side);
  const key=side+':'+units.map(u=>u.uid+':'+!!u.roundAlly).join('|');
  if(root.dataset.rosterKey!==key){
    const focused=document.activeElement,focusUid=focused?.dataset.liveInspect,focusSide=focused?.dataset.rosterSide;
    root.rosterScroll??={};
    root.rosterScroll[root.dataset.rosterSide||0]=root.querySelector('.live-roster-cards')?.scrollLeft||0;
    root.dataset.rosterKey=key;
    root.dataset.rosterSide=side;
    root.innerHTML=`<div class="live-roster-head"><div class="live-roster-tabs" aria-label="Combat roster">${[[0,'Your team'],[1,'Opponents']].map(([id,label])=>`<button data-roster-side="${id}" aria-pressed="${id===side}">${label} <span data-roster-count="${id}"></span></button>`).join('')}</div><small>Tap a portrait to inspect</small></div><div class="live-roster-cards">${units.map(u=>`<article class="live-unit-card" data-live-unit="${u.uid}" aria-label="${creatureName(u)} combat status"><button class="live-unit-portrait" data-live-inspect="${u.uid}" aria-label="Inspect ${creatureName(u)}">${image(u)}<span><strong>${creatureName(u)}</strong><small>${BY_ID[u.id].role} · Lv. ${u.level}${u.roundAlly?' · ROUND ALLY':''}</small></span></button><div class="live-vital-label"><span>HP</span><b data-hud-hp></b></div><div class="live-health-bar" role="progressbar" aria-label="${creatureName(u)} health" aria-valuemin="0" aria-valuemax="100"><i></i></div><div class="live-vital-label"><span>Stamina</span><b data-hud-stamina></b></div><div class="live-stamina-bar" role="progressbar" aria-label="${creatureName(u)} stamina" aria-valuemin="0" aria-valuemax="100"><i></i></div><div class="live-unit-skills" aria-label="Skill recovery">${Object.keys(u.cooldowns).map(id=>`<span class="live-unit-skill" data-hud-skill="${id}" tabindex="0"><span>${SKILLS[id]?.icon||'✧'}</span><b></b><i></i></span>`).join('')}</div><div class="live-unit-condition" data-hud-condition></div>${side===1?`<button class="live-focus-button" data-enemy-focus="${u.uid}">◎ Focus</button>`:''}</article>`).join('')}</div>`;
    root.querySelector('.live-roster-cards').scrollLeft=root.rosterScroll[side]||0;
    const restore=focusSide!==undefined?root.querySelector(`[data-roster-side="${focusSide}"]`):focusUid?root.querySelector(`[data-live-inspect="${focusUid}"]`):null;
    restore?.focus({preventScroll:true});
  }
  for(const id of [0,1]){
    const all=battle.units.filter(u=>u.side===id);
    root.querySelector(`[data-roster-count="${id}"]`).textContent=`${all.filter(u=>u.hp>0).length}/${all.length}`;
  }
  for(const card of root.querySelectorAll('[data-live-unit]')){
    const u=units.find(u=>u.uid===card.dataset.liveUnit);if(!u)continue;
    if(controls){let commands=card.querySelector('.roster-commands');if(!commands){commands=document.createElement('div');commands.className='roster-commands';card.prepend(commands);}const html=controls(u,side);if(commands.innerHTML!==html)commands.innerHTML=html;}
    card.classList.toggle('selected',u.uid===selectedUid);
    card.classList.toggle('knocked-out',u.hp<=0);
    card.classList.toggle('low-health',u.hp>0&&u.hp/u.maxHp<=.25);
    card.querySelector('[data-hud-hp]').textContent=`${Math.ceil(Math.max(0,u.hp))} / ${Math.round(u.maxHp)}`;
    card.querySelector('[data-hud-stamina]').textContent=`${Math.round(u.stamina)} / 100`;
    for(const [selector,value]of [['.live-health-bar',percent(u.hp,u.maxHp)],['.live-stamina-bar',percent(u.stamina,100)]]){
      const bar=card.querySelector(selector);bar.firstElementChild.style.width=value+'%';bar.setAttribute('aria-valuenow',String(Math.round(value)));
    }
    for(const el of card.querySelectorAll('[data-hud-skill]')){
      const id=el.dataset.hudSkill,cd=u.cooldowns[id],remaining=Math.max(0,cd.remaining);
      const ready=u.hp>0&&remaining<=0;
      el.classList.toggle('ready',ready);
      el.querySelector('b').textContent=u.hp<=0?'—':ready?'Ready':remaining.toFixed(1)+'s';
      el.querySelector('i').style.width=(100-percent(remaining,cd.total))+'%';
      el.title=`${SKILLS[id]?.name||id}: ${u.hp<=0?'knocked out':ready?'ready':remaining.toFixed(1)+' seconds remaining'}`;
      el.setAttribute('aria-label',el.title);
    }
    const ailments=activeAilments(u),condition=card.querySelector('[data-hud-condition]');
    condition.textContent=u.hp<=0?'KNOCKED OUT':ailments.length?ailments.map(a=>`${a.name} ${a.remaining.toFixed(1)}s`).join(' · '):u.roundAlly?'Fighting for you this round':u.intention||'Ready';
    const build=relicBuildSummary(u);if(build&&u.hp>0)condition.textContent=build+' - '+condition.textContent;condition.title=condition.textContent;
    const focus=card.querySelector('[data-enemy-focus]');if(focus){focus.disabled=u.hp<=0;focus.classList.toggle('selected',battle.focusUid===u.uid&&battle.time<battle.focusUntil);}
  }
}
