import { PrototypeArena, PROTOTYPE_CHARACTERS, PROTOTYPE_BY_ID, ANIMATION_STATES, animationState, directionalFrame, groundToScreen, screenToGround, clamp } from './prototype-engine.js';
import { drawPrototypeSprite, spritesReady, prototypePortrait, spriteCacheStats, prototypeDirectionFrames } from './prototype-sprites.js';
import { Soundscape } from './sound.js';
const $=s=>document.querySelector(s),canvas=$('#prototype-canvas'),c=canvas.getContext('2d');
const backdrop=new Image();backdrop.src='/public/prototype-glade.png';
backdrop.addEventListener('error',()=>{$('#loading').textContent='The artwork could not load. Reload this page.';});
const sound=new Soundscape();
let mode='directions',arena=new PrototypeArena(mode),selected='0-knight-0',paused=false,speed=1,last=performance.now(),uiClock=0,sounding=false;
let pose='idle',poseFacing=0,labels=true,telegraphs=true,artLoaded=false,focusView=false;
const directions=['East','Southeast','South','Southwest','West','Northwest','North','Northeast'];
const descriptions={knight:'Silver plate, a measured stride, and a committed sword strike. Aurel resists displacement and recovers deliberately.',orc:'A broad stance and a slower, heavier axe swing. Brakk hits hard, but a missed windup leaves an opening.',elf:'Light footsteps, a drawn bow, and aimed arrows. Syl creates distance; released arrows keep their original path.',caster:'An ivory hood, a planted casting stance, and a visible channel. Nyra releases an arcane bolt at the end of the windup.',wolf:'Four planted paws, a diagonal gait, and a low, quick lunge. Ember closes on the backline and changes direction quickly.'};
function selectedUnit(){return arena.units.find(u=>u.uid===selected)||arena.units[0];}
function selectedId(){return selectedUnit().id;}
function studyPose(u){
  if(pose==='attack'||pose==='cast'){
    const elapsed=arena.time%(u.windup+u.recovery);
    return {state:pose,phase:elapsed<u.windup?elapsed/u.windup:(elapsed-u.windup)/u.recovery,stage:elapsed<u.windup?'windup':'recovery'};
  }
  const duration=pose==='walk'?u.stride/u.speed:pose==='run'?u.stride/u.run:pose==='dash'?0.34:pose==='dodge'?0.29:pose==='hit'?0.13:pose==='stagger'?0.46:pose==='death'?0.95:1.8;
  return {state:pose,phase:pose==='death'?Math.min(1,arena.time/duration):(arena.time/duration)%1};
}
function chooseUnit(uid){selected=uid;updateUI();}
function makeCards(){
  $('#character-cards').innerHTML=PROTOTYPE_CHARACTERS.map((s,i)=>`<button class="character-card ${selected===`0-${s.id}-${i}`?'active':''}" data-select="0-${s.id}-${i}"><img src="${spritesReady()?prototypePortrait(s.id):''}" alt="${s.name}"><span class="role">${s.role.toUpperCase()}</span><strong>${s.name.split(' · ')[0]}</strong><small>${s.id==='wolf'?'Ember wolf':s.name.split(' · ')[1]}</small><div class="stats"><span>${s.mass.toFixed(1)} mass</span><span class="card-state">Ready</span></div><div class="hp-track"><i style="width:100%"></i></div><small class="card-health">${s.hp} / ${s.hp} HP</small></button>`).join('');
}
function changeMode(next){
  const id=selectedId();mode=next;arena=new PrototypeArena(mode);selected=arena.units.find(u=>u.id===id&&u.side===0).uid;
  $('#result').hidden=true;$('#pose-controls').hidden=!['study','directions'].includes(mode);
  $('#facing-control').hidden=mode==='directions';$('#focus-view').disabled=mode==='directions';
  for(const b of document.querySelectorAll('[data-scene]')){b.classList.toggle('active',b.dataset.scene===mode);b.setAttribute('aria-pressed',b.dataset.scene===mode);}
  $('#scene-title').textContent=mode==='battle'?'THE OLD COURTYARD':mode==='movement'?'THE LONG WAY AROUND':mode==='directions'?'ONE CHARACTER. EIGHT VIEWS.':'A STUDY IN MOTION';
  $('#scene-status').textContent=mode==='battle'?'Five companions · five challengers':mode==='movement'?'Five gaits · eight directions':mode==='directions'?'Click a view to inspect it up close':'Eleven states · eight directions';
  updateUI();
}
function updateUI(){
  const u=selectedUnit(),spec=PROTOTYPE_BY_ID[u.id];
  $('#inspect-name').textContent=spec.name;$('#inspect-role').textContent=spec.role.toUpperCase();$('#inspect-description').textContent=descriptions[u.id];
  for(const card of document.querySelectorAll('[data-select]')){
    const unit=arena.units.find(u=>u.uid===card.dataset.select);if(!unit)continue;
    card.classList.toggle('active',unit.uid===selected);card.setAttribute('aria-pressed',unit.uid===selected);
    card.querySelector('.card-state').textContent=['study','directions'].includes(mode)?pose:animationState(unit);
    card.querySelector('.hp-track i').style.width=Math.max(0,unit.hp/unit.maxHp*100)+'%';
    card.querySelector('.card-health').textContent=`${Math.ceil(unit.hp)} / ${unit.maxHp} HP`;
  }
  for(const b of document.querySelectorAll('.action-buttons button'))b.disabled=mode!=='battle'||u.hp<=0||arena.done;
  $('#scene-clock').textContent=`${String(Math.floor(arena.time/60)).padStart(2,'0')}:${String(Math.floor(arena.time%60)).padStart(2,'0')}`;
  $('#contact-count').textContent=`${arena.metrics.hits} CONTACTS · ${arena.metrics.misses} MISSES`;
  const facing=mode==='directions'?'All eight views':directions[mode==='study'?poseFacing:directionalFrame(u.facing)];
  $('#facing-status').textContent=`${spec.name.split(' · ')[0]} · ${facing}`;
  const events=arena.events.filter(e=>['contact','miss','interrupt','death','dodge'].includes(e.type)).slice(-5).reverse();
  const name=uid=>arena.units.find(u=>u.uid===uid)?.name.split(' · ')[0]||'target';
  $('#event-feed').innerHTML=events.map(e=>`<li><time>${e.time.toFixed(1)}s</time>${e.type==='contact'?`${name(e.uid)} connects with ${name(e.targetUid)} · ${Math.round(e.damage)} damage`:e.type==='miss'?`${name(e.uid)} misses the committed attack`:e.type==='interrupt'?`${name(e.uid)} is staggered; the windup breaks`:e.type==='death'?`${name(e.uid)} falls`: `${name(e.uid)} dodges an aimed threat`}</li>`).join('')||'<li>Contact events appear here during the sparring match.</li>';
  if(arena.done&&mode==='battle'){
    $('#result').hidden=false;$('#result').innerHTML=`<strong>${arena.winner===0?'The companions prevail.':'The challengers prevail.'}</strong><p>${arena.metrics.hits} hits · ${arena.metrics.rolls} rolls · ${arena.metrics.interrupts} interruptions</p><button data-replay>Another round →</button>`;
  }
}
function ellipse(x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function background(){
  if(backdrop.complete&&backdrop.naturalWidth)c.drawImage(backdrop,0,0,1000,650);
  else{
    const g=c.createLinearGradient(0,0,0,650);g.addColorStop(0,'#273d2c');g.addColorStop(0.6,'#65734a');g.addColorStop(1,'#31412c');c.fillStyle=g;c.fillRect(0,0,1000,650);
    c.fillStyle='#9a976f';c.beginPath();c.ellipse(500,345,420,255,0,0,Math.PI*2);c.fill();
    c.strokeStyle='#343f2977';c.lineWidth=1;for(let y=120;y<610;y+=38)for(let x=70;x<940;x+=65)c.strokeRect(x+(Math.floor(y/38)%2)*30,y,63,36);
  }
  const vignette=c.createRadialGradient(500,330,220,500,330,660);vignette.addColorStop(0,'#14211900');vignette.addColorStop(1,'#0b181abb');c.fillStyle=vignette;c.fillRect(0,0,1000,650);
  // A restrained dust layer remains behind the characters.
  for(let i=0;i<18;i++)ellipse((i*137)%1000+Math.sin(arena.time*0.18+i)*5,100+(i*53)%470+Math.sin(arena.time*0.23+i)*7,1,1,'#edd99b55');
}
function render(){
  c.clearRect(0,0,1000,650);c.save();
  if(mode==='directions'){
    background();
    const u=selectedUnit();
    for(let dir=0;dir<8;dir++){
      const x=125+(dir%4)*250,y=285+Math.floor(dir/4)*282;
      c.fillStyle='#101e18aa';c.strokeStyle='#a3b98c35';c.lineWidth=1;
      c.beginPath();c.roundRect(x-109,y-221,218,260,8);c.fill();c.stroke();
      ellipse(x,y,u.id==='wolf'?41:27,9,'#091811aa');
      drawPrototypeSprite(c,{...u,facing:dir*Math.PI/4,hp:pose==='death'?0:u.hp},x,y,arena.time,1.65,studyPose(u));
      c.textAlign='center';c.fillStyle='#e4e9cf';c.font='13px system-ui';c.fillText(directions[dir].toUpperCase(),x,y+25);
    }
    c.restore();return;
  }
  if(focusView){const p=groundToScreen(selectedUnit().x,selectedUnit().y);c.translate(500,370);c.scale(1.8,1.8);c.translate(-p.x,-p.y);}
  background();c.save();
  if(arena.shake&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)c.translate(Math.sin(arena.time*92)*arena.shake,Math.cos(arena.time*71)*arena.shake*0.6);
  if(mode==='movement'){
    c.strokeStyle='#e4d9ad30';c.lineWidth=1;c.setLineDash([3,8]);
    for(let i=0;i<5;i++){const p=groundToScreen(175+i*160,400);c.beginPath();c.ellipse(p.x,p.y,59,87,0,0,Math.PI*2);c.stroke();}c.setLineDash([]);
  }
  const live=arena.units.slice().sort((a,b)=>a.y-b.y);
  for(const u of live){
    const p=groundToScreen(u.x,u.y);ellipse(p.x,p.y+1,u.id==='wolf'?27:u.radius*0.88,6,u.hp<=0?'#0a131b40':'#0a131b75');
    if(u.uid===selected&&u.hp>0){c.strokeStyle='#d7e4a6aa';c.lineWidth=1.2;c.beginPath();c.ellipse(p.x,p.y,u.radius+9,(u.radius+9)*0.38,0,0,Math.PI*2);c.stroke();}
    if(u.order&&arena.time<u.manualUntil&&u.uid===selected){const q=groundToScreen(u.order.x,u.order.y);c.strokeStyle='#d9d9a477';c.setLineDash([3,5]);c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke();c.setLineDash([]);c.beginPath();c.ellipse(q.x,q.y,8,4,0,0,Math.PI*2);c.stroke();}
  }
  if(telegraphs)for(const u of live)if(u.action&&!u.action.released&&u.id!=='elf'&&u.id!=='caster'){
    const a=u.action,p=groundToScreen(u.x,u.y),progress=a.elapsed/a.windup;
    c.save();c.translate(p.x,p.y);c.scale(1,0.58);c.strokeStyle=u.side?'#f0998588':'#e5d29966';c.fillStyle=u.side?'#d86b5422':'#e2cf8d17';c.lineWidth=1+progress*2;
    c.beginPath();c.moveTo(0,0);c.arc(0,0,u.reach,a.angle-0.7,a.angle+0.7);c.closePath();c.fill();c.stroke();c.restore();
  }
  for(const u of live){
    const x=u.px+(u.x-u.px)*arena.alpha,y=u.py+(u.y-u.py)*arena.alpha,p=groundToScreen(x,y);
    const override=mode==='study'?studyPose(u):null;
    const renderUnit=mode==='study'?{...u,facing:poseFacing*Math.PI/4,hp:pose==='death'?0:u.hp}:{...u,x,y};
    drawPrototypeSprite(c,renderUnit,p.x,p.y,arena.time,u.id==='orc'?1.02:1,override);
    if(u.hp>0&&mode==='battle'){
      const barY=p.y-(u.id==='wolf'?81:133);c.fillStyle='#12201a';c.fillRect(p.x-21,barY,42,4);c.fillStyle=u.side?'#ce8979':'#bcd796';c.fillRect(p.x-20,barY+1,40*u.hp/u.maxHp,2);
      c.fillStyle='#d4b47466';c.fillRect(p.x-20,barY+6,40*u.stamina/100,1.5);
      if(u.action&&!u.action.released){c.fillStyle=u.side?'#eb9b80':'#e7d39d';c.fillRect(p.x-20,barY+10,40*u.action.elapsed/u.action.windup,1.5);}
    }
    if(labels&&u.side===0&&u.hp>0){c.font='10px system-ui';c.textAlign='center';c.fillStyle='#ebebd2';c.shadowColor='#0c2117';c.shadowBlur=4;c.fillText(u.name.split(' · ')[0],p.x,p.y+19);c.font='8px system-ui';c.fillText(directions[mode==='study'?poseFacing:directionalFrame(u.facing)],p.x,p.y+31);c.shadowBlur=0;}
  }
  for(const p of arena.projectiles){
    const q=groundToScreen(p.x,p.y),angle=Math.atan2(p.vy*0.58,p.vx);
    c.save();c.translate(q.x,q.y-p.z);c.rotate(angle);
    if(p.kind==='arrow'){c.strokeStyle='#e3c39b';c.lineWidth=1.5;c.beginPath();c.moveTo(-17,0);c.lineTo(7,0);c.stroke();c.fillStyle='#e5e8d9';c.beginPath();c.moveTo(10,0);c.lineTo(3,-3);c.lineTo(3,3);c.fill();}
    else{c.shadowColor='#8ed7fa';c.shadowBlur=12;ellipse(0,0,6,4,'#e0fcff');c.shadowBlur=0;c.strokeStyle='#8cbeeaaa';c.lineWidth=3;c.beginPath();c.moveTo(-22,0);c.lineTo(-7,0);c.stroke();}
    c.restore();
  }
  for(const e of arena.effects){
    const p=groundToScreen(e.x,e.y),f=e.age/e.duration;c.save();c.globalAlpha=1-f;
    if(e.kind==='slash'){
      c.translate(p.x,p.y-e.z);c.scale(1,0.58);c.strokeStyle=e.color;c.lineWidth=e.heavy?6:3;c.lineCap='round';c.beginPath();c.arc(0,0,e.reach*0.65,e.angle-1.15+f*0.5,e.angle+0.6+f*0.5);c.stroke();
    }else if(e.kind==='impact'){
      c.translate(p.x,p.y-e.z);c.rotate(e.age*5);c.strokeStyle=e.color;c.lineWidth=e.heavy?3:2;c.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3;c.moveTo(Math.cos(a)*(4+f*15),Math.sin(a)*(4+f*15));c.lineTo(Math.cos(a)*(13+f*22),Math.sin(a)*(13+f*22));}c.stroke();
    }else if(e.kind==='number'){c.font='bold 12px Georgia';c.fillStyle=e.color;c.textAlign='center';c.shadowColor='#14241c';c.shadowBlur=3;c.fillText(e.text,p.x,p.y-e.z-e.age*21);}
    c.restore();
  }
  for(const particle of arena.particles){const p=groundToScreen(particle.x,particle.y);c.globalAlpha=1-particle.age/particle.duration;ellipse(p.x,p.y-particle.z,1.8,1.8,particle.color);}c.globalAlpha=1;c.restore();c.restore();
}
function togglePause(){paused=!paused;$('#play-pause').textContent=paused?'Play':'Pause';$('#play-pause').setAttribute('aria-label',paused?'Resume scene':'Pause scene');}
function selectedRoll(kind){const u=selectedUnit();arena.roll(u,u.facing+(kind==='dodge'?Math.PI/2:0),kind);}
document.addEventListener('click',e=>{
  const el=e.target.closest('button');if(!el)return;
  if(el.dataset.select)chooseUnit(el.dataset.select);
  if(el.dataset.scene)changeMode(el.dataset.scene);
  if(el.dataset.speed){speed=Number(el.dataset.speed);for(const b of document.querySelectorAll('[data-speed]'))b.classList.toggle('active',Number(b.dataset.speed)===speed);}
  if(el.dataset.pose){pose=el.dataset.pose;arena.time=0;for(const b of document.querySelectorAll('[data-pose]'))b.classList.toggle('active',b.dataset.pose===pose);}
  if(el.id==='play-pause')togglePause();
  if(el.id==='restart'||el.hasAttribute('data-replay'))changeMode(mode);
  if(el.id==='frame-step'){if(!paused)togglePause();arena.step(1/12);render();updateUI();}
  if(el.id==='order-dash')selectedRoll('dash');if(el.id==='order-dodge')selectedRoll('dodge');
  if(el.id==='order-attack'){const u=selectedUnit(),target=arena.target(u);if(target)arena.attack(u,target);}
  if(el.id==='sound-toggle'){sounding=!sounding;sound.begin(0,sounding);el.textContent=sounding?'Sound on':'Sound off';el.setAttribute('aria-pressed',sounding);}
  if(el.id==='focus-view'){focusView=!focusView;el.textContent=focusView?'Wide view':'Focus selected';el.setAttribute('aria-pressed',focusView);}
});
$('#pose-facing').addEventListener('change',e=>poseFacing=Number(e.target.value));
$('#show-labels').addEventListener('change',e=>labels=e.target.checked);
$('#show-telegraphs').addEventListener('change',e=>telegraphs=e.target.checked);
canvas.addEventListener('pointerdown',e=>{
  const r=canvas.getBoundingClientRect();let sx=(e.clientX-r.left)*1000/r.width,sy=(e.clientY-r.top)*650/r.height;
  if(mode==='directions'){
    if(sy<64||sy>606)return;
    poseFacing=clamp(Math.floor(sx/250),0,3)+(sy>=346?4:0);$('#pose-facing').value=String(poseFacing);
    changeMode('study');focusView=true;$('#focus-view').textContent='Wide view';$('#focus-view').setAttribute('aria-pressed','true');return;
  }
  if(focusView){const p=groundToScreen(selectedUnit().x,selectedUnit().y);sx=p.x+(sx-500)/1.8;sy=p.y+(sy-370)/1.8;}
  const point=screenToGround(sx,sy);
  if(mode!=='battle')return;
  const near=arena.units.filter(u=>u.side===0&&u.hp>0).sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y))[0];
  if(near&&Math.hypot(near.x-point.x,near.y-point.y)<35)chooseUnit(near.uid);else arena.moveOrder(selected,point);
  canvas.focus();
});
document.addEventListener('keydown',e=>{
  if(e.target.matches('select,input,button,a'))return;
  if(e.code==='Space'){e.preventDefault();togglePause();}
  if(e.key.toLowerCase()==='r')changeMode(mode);
  if(mode!=='battle')return;
  if(e.key.toLowerCase()==='d')selectedRoll('dash');
  if(e.key.toLowerCase()==='f'){const u=selectedUnit(),t=arena.target(u);if(t)arena.attack(u,t);}
  if(e.key.startsWith('Arrow')){
    e.preventDefault();const u=selectedUnit(),v={ArrowLeft:[-90,0],ArrowRight:[90,0],ArrowUp:[0,-90],ArrowDown:[0,90]}[e.key];arena.moveOrder(u.uid,{x:u.x+v[0],y:u.y+v[1]});
  }
});
$('#pose-states').innerHTML=ANIMATION_STATES.map(s=>`<button data-pose="${s}" class="${s===pose?'active':''}">${s[0].toUpperCase()+s.slice(1)}</button>`).join('');
window.addEventListener('prototype-art-ready',()=>{makeCards();updateUI();});
window.addEventListener('prototype-art-error',()=>{$('#loading').textContent='The artwork could not load. Reload this page.';});
document.addEventListener('visibilitychange',()=>{last=performance.now();});
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000);last=now;
  if(!artLoaded&&spritesReady()&&backdrop.complete&&backdrop.naturalWidth){artLoaded=true;$('#loading').hidden=true;makeCards();updateUI();}
  if(!paused&&artLoaded&&!document.hidden)arena.step(dt*speed);
  const events=arena.audio.splice(0);if(sounding)for(const event of events)sound.event(event);
  render();uiClock+=dt;if(uiClock>0.1){updateUI();uiClock=0;}
  requestAnimationFrame(frame);
}
makeCards();changeMode('directions');requestAnimationFrame(frame);
// Read-only instrumentation for reproducible browser verification.
window.prototypeLab={get state(){return {arena,mode,selected,paused,speed,pose,poseFacing,artLoaded,focusView,cache:spriteCacheStats()};},get sample(){return {id:selectedId(),state:['study','directions'].includes(mode)?pose:animationState(selectedUnit())};},directionFrames:prototypeDirectionFrames};
