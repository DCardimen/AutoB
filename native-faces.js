// Pixel-authored family faces. Rear views never retain front-facing features.
export function drawFamilyFace(b,h,dir,p,rig,views){
 const id=rig.design;if(!['dwarf','goblin','skeleton','troll','minotaur','serpent','harpy','faerie','bat','rogue','frostelf','phoenix'].includes(id))return false;
 const v=views[dir],x=Math.round(h.x),y=Math.round(h.y),back=!v.eyes.length,sign=v.sign,profile=v.view==='profile',dead=rig.death>0,O='#20272a';
 const oval=(x,y,rx,ry,c)=>{b.oval(x,y,rx+1,ry+1,O);b.oval(x,y,rx,ry,c);};
 const eyes=(color)=>{if(back)return;for(const dx of v.eyes){const xx=x+Math.round(dx*.75);b.rect(xx,y,dead?2:1,dead?1:2,O);if(!dead)b.dot(xx,y,color);}};
 const horns=(r=9)=>{for(const s of profile?[-sign]:[-1,1]){b.line({x:x+s*5,y:y-4},{x:x+s*r,y:y-8},O,1);b.line({x:x+s*5,y:y-4},{x:x+s*r,y:y-8},p.metal[2]);b.dot(x+s*r,y-9,p.metal[3]);}};
 const skin=id==='skeleton'?p.skin[2]:p.skin[1];
 oval(x,y,id==='troll'||id==='minotaur'?8:6,id==='serpent'?4:7,skin);b.oval(x-2,y-3,3,2,p.skin[2]);
 if(id==='skeleton'){
  if(!back){for(const dx of v.eyes)b.rect(x+dx-1,y-1,2,3,O);b.dot(x+sign*2,y+2,O);b.rect(x-3+sign*2,y+4,6,1,O);for(const dx of [-2,0,2])b.dot(x+dx+sign*2,y+5,p.skin[0]);}else b.line({x:x-3,y:y+2},{x:x+2,y:y-1},p.skin[0]);
 }else if(id==='serpent'||id==='phoenix'){
  if(!back){const nx=x+(profile?sign*6:sign*3);b.outlined([{x:nx-sign,y:y+1},{x:nx+(sign||1)*5,y:y+2},{x:nx,y:y+4}],id==='phoenix'?p.metal[3]:p.skin[0]);eyes(id==='phoenix'?'#fff3b9':'#f3d579');}
  b.line({x:x-3,y:y-4},{x:x,y:y-8},p.hair[1],1);b.line({x:x,y:y-8},{x:x+3,y:y-5},p.hair[2]);
 }else if(id==='bat'){
  for(const s of profile?[-sign]:[-1,1])b.outlined([{x:x+s*4,y:y-3},{x:x+s*7,y:y-12},{x:x+s*1,y:y-6}],p.skin[0]);
  if(!back){eyes('#e7bd7b');oval(x+sign*3,y+3,3,2,p.skin[0]);for(const dx of [-2,2])b.dot(x+dx+sign*2,y+5,p.metal[3]);}
 }else{
  if(['goblin','faerie','frostelf'].includes(id))for(const s of profile?[-sign]:[-1,1])b.outlined([{x:x+s*5,y:y-1},{x:x+s*(id==='goblin'?12:9),y:y-3},{x:x+s*6,y:y+3}],p.skin[1]);
  if(id==='minotaur')horns(10);
  if(id==='rogue'){b.outlined([{x:x-7,y:y+3},{x:x-7,y:y-4},{x:x-3,y:y-8},{x:x+3,y:y-8},{x:x+7,y:y-4},{x:x+7,y:y+3},{x:x+4,y:y+5},{x:x+4,y:y-2},{x:x-4,y:y-2},{x:x-4,y:y+5}],p.cloth[0]);}
  else if(id==='dwarf'){b.rect(x-6,y-6,12,3,p.metal[1]);b.rect(x-4,y-7,8,1,p.metal[3]);}
  else if(id==='troll'){b.oval(x,y-7,5,2,p.hair[1]);b.dot(x-4,y-8,p.hair[2]);}
  else{b.oval(x,y-5,5,3,p.hair[1]);b.line({x:x-3,y:y-6},{x:x+2,y:y-7},p.hair[2]);}
  if(back){b.oval(x,y+1,4,5,id==='rogue'?p.cloth[0]:id==='dwarf'?p.hair[0]:p.hair[1]);}
  else{eyes(id==='goblin'?'#f1d77e':id==='frostelf'?'#80d1dc':'#ddcda6');b.dot(x+(profile?sign*5:sign*2),y+3,p.skin[0]);b.rect(x-1+sign*2,y+5,3,1,p.skin[0]);}
  if(id==='dwarf'){b.outlined([{x:x-5,y:y+2},{x:x-2,y:y+4},{x:x+2,y:y+4},{x:x+5,y:y+2},{x:x+4,y:y+8},{x:x,y:y+11},{x:x-4,y:y+8}],p.hair[1]);b.line({x:x-2,y:y+5},{x:x-1,y:y+9},p.hair[2]);b.line({x:x+2,y:y+5},{x:x+1,y:y+9},p.hair[0]);b.dot(x,y+9,p.metal[3]);}
  if(id==='minotaur'&&!back){oval(x+sign*2,y+3,4,2,p.skin[0]);b.dot(x-1+sign*2,y+3,O);b.dot(x+2+sign*2,y+3,O);}
  if(id==='harpy')b.line({x:x,y:y-7},{x:x-sign*3,y:y-11},p.hair[2],1);
 }
 if(rig.form){if(rig.formPath==='wild'){horns(rig.form===2?11:8);b.dot(x,y-9,p.cloth[2]);}else{b.line({x:x-5,y:y-5},{x:x+5,y:y-5},p.metal[2]);b.dot(x,y-6,p.metal[3]);}}
 return true;
}
