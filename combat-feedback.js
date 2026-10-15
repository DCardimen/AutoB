import {nativeBladePoint,nativeMuzzle,nativeBodyHeight} from './native-combat.js';

const screen=(x,y)=>({x,y:y*.58+75});

// Cosmetic only: geometry comes from the same weapon/muzzle anchors as combat.
export function paintActionFeedback(c,battle,height=1){
  const intensity=Math.min(1.5,(battle.tuning?.effectIntensity??100)/100);
  if(!intensity)return;
  c.save();
  for(const strike of battle.strikes){
    if(!strike.nativeMelee||strike.cancelled||strike.source.hp<=0)continue;
    const phase=Math.min(1,1-strike.remaining/strike.total);
    if(phase<.48)continue;
    c.strokeStyle=strike.charged?'#d0faff':strike.heavy?'#ffc28d':'#fff3ca';
    c.lineCap='round';
    for(let ribbon=0;ribbon<3;ribbon++){
      c.globalAlpha=(.7-ribbon*.2)*intensity;c.lineWidth=3-ribbon*.7;c.beginPath();
      const end=phase-ribbon*.022,start=Math.max(.48,end-(battle.reducedMotion?.035:.14));
      for(let i=0;i<=9;i++){
        const blade=nativeBladePoint(strike.source,strike,start+(end-start)*i/9),p=screen(blade.x,blade.y);
        i?c.lineTo(p.x,p.y-blade.z*height):c.moveTo(p.x,p.y-blade.z*height);
      }
      c.stroke();
    }
  }
  for(const u of battle.living(0).concat(battle.living(1))){
    if(u.roundAlly){const p=screen(u.x,u.y);c.globalAlpha=.8;c.strokeStyle='#9ff4e5';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,22,10,0,0,Math.PI*2);c.stroke();c.fillStyle='#baffed';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('ROUND ALLY',p.x,p.y+33);}
    const action=u.nativeAction;
    if(action&&!action.released&&(action.casting||u.range>100&&!['elf','fox'].includes(u.nativeActor?.id))){
      const muzzle=nativeMuzzle(u,u.targetMemory||{x:u.x+u.face*100,y:u.y}),p=screen(muzzle.x,muzzle.y),charge=Math.min(1,action.elapsed/action.windup),r=5+charge*11;
      c.globalAlpha=(.45+.5*charge)*intensity;c.strokeStyle='#d8bbff';c.fillStyle='#fff6df';c.lineWidth=2;
      c.beginPath();c.arc(p.x,p.y-muzzle.z*height,r,0,Math.PI*2);c.stroke();
      for(let i=0;i<5;i++){const a=i*Math.PI*.4+(battle.reducedMotion?0:battle.time*5);c.fillRect(p.x+Math.cos(a)*r-1,p.y-muzzle.z*height+Math.sin(a)*r-1,3,3);}
      c.fillRect(p.x-2,p.y-muzzle.z*height-2,5,5);
    }
    if(u.rollTime>0&&u.dodgeStyle!=='blink'){
      const p=screen(u.x,u.y);c.strokeStyle=u.dodgeStyle==='barrel'?'#f7c68b':'#afe7de';c.lineWidth=u.dodgeStyle==='barrel'?4:2;c.globalAlpha=.6*intensity;
      for(let i=1;i<=3;i++){c.beginPath();c.moveTo(p.x-u.rollX*i*12,p.y-u.rollY*i*7-8);c.lineTo(p.x-u.rollX*(i*12+10),p.y-u.rollY*(i*7+6)-8);c.stroke();}
    }
  }
  const focus=battle.living(1).find(u=>u.uid===battle.focusUid&&battle.time<battle.focusUntil);
  if(focus){const p=screen(focus.x,focus.y);c.globalAlpha=.9;c.strokeStyle='#ffdb87';c.lineWidth=2;const r=25+(battle.reducedMotion?0:Math.sin(battle.time*5)*3);c.beginPath();c.ellipse(p.x,p.y,r,r*.58,0,0,Math.PI*2);c.stroke();c.fillStyle='#ffe4a4';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText('FOCUS '+Math.ceil(battle.focusUntil-battle.time)+'s',p.x,p.y-nativeBodyHeight(focus)*height-25);}
  c.restore();
}

export function paintImpact(c,e,p,z=40){
  const progress=1-e.ttl/(e.max||.45),r=(e.r||22)*(.25+progress*.9);
  // A short ground ripple makes the transferred weight readable without changing source pixels.
  c.save();c.translate(p.x,p.y);c.scale(1,.58);c.lineWidth=1.5;c.beginPath();c.arc(0,0,(e.groundRadius||8)+progress*(e.heavy?20:12),0,Math.PI*2);c.stroke();c.restore();
  c.translate(p.x,p.y-z);c.rotate(e.angle||0);
  if(e.blocked){c.beginPath();c.arc(0,0,r*.8,-1.1,1.1);c.stroke();return;}c.lineWidth=Math.max(1,3*(1-progress));
  c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.stroke();
  for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(Math.cos(a)*r*.6,Math.sin(a)*r*.6);c.lineTo(Math.cos(a)*(r+8),Math.sin(a)*(r+8));c.stroke();}
  if(progress<.35){c.fillStyle='#fff7db';c.beginPath();c.moveTo(-9,0);c.lineTo(-2,-2);c.lineTo(0,-10);c.lineTo(2,-2);c.lineTo(9,0);c.lineTo(2,2);c.lineTo(0,10);c.lineTo(-2,2);c.closePath();c.fill();}
}
