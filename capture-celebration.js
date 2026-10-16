const ranks={Common:0,Uncommon:1,Rare:2,Epic:3,Legendary:4};
export function captureCelebrationProfile(rarity){
 const rank=ranks[rarity]??0;
 return {rank,confetti:[14,24,38,58,88][rank],beams:[0,2,4,7,11][rank],streamers:[0,1,3,6,10][rank],duration:2.5+rank*.45};
}
export function celebrateCapture(host,{rarity='Common',name='',reducedMotion=false}={}){
 if(!host)return;
 host.querySelector('.capture-celebration')?.remove();
 const profile=captureCelebrationProfile(rarity),root=document.createElement('div');
 root.className='capture-celebration rarity-'+rarity.toLowerCase();root.dataset.rarity=rarity;root.setAttribute('role','status');
 const title=document.createElement('strong');title.textContent='CAPTURED!';
 const subtitle=document.createElement('span');subtitle.textContent=rarity+' · '+name+' joins your expedition';
 root.append(title,subtitle);host.append(root);
 if(reducedMotion){root.classList.add('gentle-celebration');setTimeout(()=>root.remove(),2200);return;}
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');root.prepend(canvas);const c=canvas.getContext('2d');
 const started=performance.now();
 function frame(now){
  if(!root.isConnected)return;
  const age=(now-started)/1000,t=age/profile.duration,w=host.clientWidth,h=host.clientHeight;
  if(t>=1){root.remove();return;}
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  c.clearRect(0,0,w,h);root.style.setProperty('--celebration-age',age);root.style.opacity=String(Math.min(1,t*12,(1-t)*6));
  const cx=w/2,cy=h*.32;
  for(let i=0;i<profile.beams;i++){
   const angle=i*Math.PI*2/profile.beams+age*.16,length=Math.min(w,h)*(.22+t*.35);
   c.save();c.translate(cx,cy);c.rotate(angle);const ink=c.createLinearGradient(0,0,length,0);
   ink.addColorStop(0,'hsla('+((i*51+age*28)%360)+',100%,80%,.65)');ink.addColorStop(1,'transparent');
   c.fillStyle=ink;c.beginPath();c.moveTo(0,0);c.lineTo(length,-2-profile.rank);c.lineTo(length,2+profile.rank);c.fill();c.restore();
  }
  for(let i=0;i<profile.confetti;i++){
   const delay=(i%7)*.025,life=Math.max(0,age-delay),angle=(i*2.39996),speed=42+(i*37)%140;
   const x=cx+Math.cos(angle)*speed*life,y=cy+Math.sin(angle)*speed*life+32*life*life;
   c.save();c.translate(x,y);c.rotate(life*(i%2?3:-2));c.globalAlpha=Math.min(1,Math.max(0,1-life/profile.duration));
   c.fillStyle='hsl('+((i*47+age*14)%360)+' 95% 68%)';c.fillRect(-2,-1,(i%3)+3,2+(i%2)*3);c.restore();
  }
  for(let i=0;i<profile.streamers;i++){
   const angle=i*2.39996,length=(22+i*4)*age,x=cx+Math.cos(angle)*length,y=cy+Math.sin(angle)*length+age*age*10;
   c.strokeStyle='hsl('+((i*73+age*24)%360)+' 95% 70%)';c.lineWidth=1.5;c.beginPath();
   for(let n=0;n<18;n++){const xx=x+Math.sin(n*.65+age*4)*5,yy=y+n*2.2;n?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();
  }
  requestAnimationFrame(frame);
 }requestAnimationFrame(frame);
}
