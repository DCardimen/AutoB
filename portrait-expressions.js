// Measured on the original head-on (direction 2), first-form artwork.
// Eyes are [center x, center y, horizontal radius, vertical radius].
// These are painted facial features, never landmarks inferred from a proxy rig.
const face=(eyes,mouth,neck,gesture,mood='smile',duration=2100)=>({eyes,mouth,neck,gesture,mood,duration});
const pair=(x,y,rx=4,ry=4)=>[[x,y,rx,ry],[64-x,y,rx,ry]];
export const PORTRAIT_PROFILES={
 feralfox:face(pair(25,27,4,4),[32,34],35,'ear-flick','smile'),
 wolf:face(pair(24,22,4,4),[32,30],33,'nose-sniff','smile'),
 cat:face(pair(24,24,4,5),[32,33],35,'cat-whiskers','smile',2500),
 lion:face(pair(24,20,4,4),[32,29],32,'proud-cub','scowl'),
 rabbit:face(pair(25,29,3,4),[32,36],38,'rabbit-ears','surprise'),
 rodent:face(pair(24,26,4,4),[32,34],36,'whisker-sniff','smile'),
 rhino:face(pair(24,26,3,4),[32,33],35,'horn-snort','scowl',2300),
 turtle:face(pair(22,20,5,6),[32,29],31,'shell-peek','smile',2500),
 owl:face(pair(24,17,5,6),[32,24],29,'owl-head-tilt','smile',2600),
 fish:face(pair(24,28,4,5),[32,35],37,'fish-bubbles','surprise'),
 mushroom:face(pair(26,30,3,3),[32,36],38,'cap-tip','smile',2400),
 mantis:face(pair(23,18,4,6),[32,27],29,'antenna-salute','scowl'),
 clam:face(pair(26,29,3,3),[32,35],37,'shell-kiss','smile',2400),
 squid:face(pair(24,25,4,5),[32,32],34,'mantle-pulse','surprise'),
 knight:face(pair(27,23,3,3),[32,28],30,'sword-shoulder','smile',2400),
 orc:face(pair(25,17,4,4),[32,24],27,'friendly-wave','smile',2300),
 elf:face(pair(27,17,3,3),[32,23],26,'archer-grin','smile',2300),
 caster:face(pair(27,17,3,4),[32,24],27,'spell-smile','smile',2300),
 fox:face(pair(25,20,4,4),[32,27],29,'fox-grin','smile'),
 goblin:face(pair(26,18,3,4),[32,25],28,'mischief-scowl','scowl'),
 fairy:face(pair(27,17,3,3),[32,24],27,'flower-wings','smile',2400),
 bear:face(pair(24,20,4,4),[32,29],32,'bear-yawn','smile',2600),
 stag:face(pair(25,20,3,4),[32,28],31,'listening-ears','smile'),
 drake:face(pair(24,20,4,4),[32,28],31,'dragon-roar','scowl',2500),
 beetle:face(pair(24,23,4,4),null,30,'beetle-horn','scowl'),
 bat:face(pair(24,22,4,4),[32,29],32,'bat-ear-prick','smile',2300),
 phoenix:face(pair(24,17,4,5),[32,25],28,'phoenix-preen','smile',2400),
 rogue:face(pair(27,15,3,3),[32,22],25,'rogue-glare','scowl',2300),
 frostelf:face(pair(26,16,3,3),[32,23],26,'frost-poise','smile',2300),
 troll:face(pair(25,16,3,3),[32,24],27,'troll-huff','scowl',2400),
 mech:face([[32,14,6,5]],null,25,'optic-scan','focus',2400),
 spider:face(pair(24,29,3,3),null,35,'fang-grin','smile'),
 jelly:face(pair(24,24,4,4),[32,32],34,'jelly-squeeze','smile',2400),
 serpent:face(pair(25,19,3,4),[32,27],30,'serpent-hiss','scowl',2300),
 harpy:face(pair(27,17,3,3),[32,23],26,'harpy-feathers','smile',2300),
 moth:face(pair(24,27,4,4),[32,34],36,'moth-antennae','smile',2600),
 crab:face(pair(24,24,4,4),null,31,'claw-hello','scowl',2300),
 centipede:face(pair(24,22,4,4),null,30,'visor-squint','scowl',2300),
 dwarf:face(pair(27,13,2,2),[32,19],24,'dwarf-chuckle','smile',2300),
 minotaur:face(pair(26,18,3,3),[32,25],28,'bull-huff','scowl',2400),
 skeleton:face(pair(25,14,3,4),[32,22],25,'skeletal-grin','smile',2400),
};
PORTRAIT_PROFILES.faerie=PORTRAIT_PROFILES.fairy;
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function portraitExpressionAt(design,progress){
 const profile=PORTRAIT_PROFILES[design];if(!profile)throw new Error('Unreviewed portrait design: '+design);
 const p=clamp(progress),strength=smooth(p/.16)*smooth((1-p)/.2);
 // Keep both eyes open throughout. Hold the expression long enough to read.
 const mode=p<.18||p>.84?'open':profile.mood;
 return {...profile,mode,strength,progress:p};
}
const key=(x,y)=>y*64+x;
const light=p=>p.rgb[0]+p.rgb[1]+p.rgb[2];
const cache=new WeakMap();
function facialMaterials(asset,profile){
 let byProfile=cache.get(asset);if(!byProfile){byProfile=new Map();cache.set(asset,byProfile);}if(byProfile.has(profile))return byProfile.get(profile);
 const grid=new Map(asset.pixels.map(p=>[key(p.x,p.y),p]));
 const materials=profile.eyes.map(([cx,cy,rx,ry])=>{
  const area=asset.pixels.filter(p=>Math.abs(p.x-cx)<=rx&&Math.abs(p.y-cy)<=ry),ink=area.reduce((a,b)=>light(a)<light(b)?a:b);
  const below=grid.get(key(cx,cy+ry+2)),ring=asset.pixels.filter(p=>Math.abs(p.x-cx)<=rx+2&&Math.abs(p.y-cy)<=ry+2&&Math.abs(p.y-cy)>ry&&light(p)>light(ink)+80);
  const skin=below&&light(below)>light(ink)+80?below:ring.sort((a,b)=>Math.hypot(a.x-cx,a.y-(cy+ry+1))-Math.hypot(b.x-cx,b.y-(cy+ry+1)))[0]||area.reduce((a,b)=>light(a)>light(b)?a:b);
  return {ink:ink.index,skin:skin.index};
 });
 byProfile.set(profile,materials);return materials;
}
// Edit only existing opaque pixels in small measured eye/mouth regions.
// Replacement colors remain source palette indices, including recolored variants.
export function portraitExpressionLayer(layer,asset,design,progress){
 const profile=PORTRAIT_PROFILES[design],expression=portraitExpressionAt(design,progress);
 if(expression.mode==='open')return layer;
 const materials=facialMaterials(asset,profile),changes=new Map(),available=new Set(layer.map(p=>key(p.x,p.y)));
 const put=(x,y,index)=>{x=Math.round(x);y=Math.round(y);if(available.has(key(x,y)))changes.set(key(x,y),index);};
 profile.eyes.forEach(([cx,cy,rx,ry],i)=>{
  const {ink,skin}=materials[i],mode=expression.mode;
  if(mode==='scowl'){
   const side=i===0?-1:1;
   for(let x=cx-rx;x<=cx+rx;x++){
    const brow=cy-ry*.7-side*(x-cx)*.45;
    for(let y=cy-ry;y<brow;y++)if(((x-cx)/(rx+.5))**2+((y-cy)/(ry+.5))**2<=1)put(x,y,skin);
    if(Math.abs(x-cx)<rx)put(x,brow,ink);
   }
  }
 });
 if(profile.mouth){
  const [cx,cy]=profile.mouth,ink=materials[0].ink;
  if(expression.mode==='smile')for(let dx=-2;dx<=2;dx++)put(cx+dx,cy+(Math.abs(dx)<2?1:0),ink);
  if(expression.mode==='scowl')for(let dx=-2;dx<=2;dx++)put(cx+dx,cy+(Math.abs(dx)===2?1:0),ink);
  if(expression.mode==='surprise')for(const [dx,dy]of [[-1,0],[0,-1],[1,0],[0,1]])put(cx+dx,cy+dy,ink);
 }
 if(design==='mech'){
  const blue=asset.pixels.filter(p=>p.x>=27&&p.x<=37&&p.y>=10&&p.y<=18&&p.rgb[2]>p.rgb[0]*1.2).sort((a,b)=>light(b)-light(a))[0];
  if(blue){const x=28+Math.round(expression.progress*10)%8;for(let y=12;y<=15;y++)put(x,y,blue.index);}
 }
 return layer.map(p=>changes.has(key(p.x,p.y))?{...p,index:changes.get(key(p.x,p.y))}:p);
}

// Small continuous source-art offsets. Neck/ear/wing roots stay at zero;
// lower limbs remain on the existing authored leg skinning path.
export function portraitSourceOffset(design,x,y,progress){
 const {gesture,neck,strength,progress:p}=typeof progress==='object'?progress:portraitExpressionAt(design,progress),head=smooth((neck-y)/8),side=Math.sign(x-32),outer=smooth((Math.abs(x-32)-9)/10),ear=smooth((18-y)/10)*outer;
 let dx=0,dy=0;
 const flick=Math.sin(p*Math.PI*6)*strength;
 if(['ear-flick','cat-whiskers','rabbit-ears','listening-ears','bat-ear-prick','moth-antennae','antenna-salute','visor-squint'].includes(gesture)){
  dx+=side*ear*flick*(gesture==='rabbit-ears'?2:1.3);dy+=ear*strength*(gesture==='bat-ear-prick'?-1:0);
 }
 if(gesture==='antenna-salute')dx+=side*smooth((14-y)/10)*smooth((Math.abs(x-32)-2)/5)*flick*2;
 if(['nose-sniff','whisker-sniff','horn-snort','troll-huff','bull-huff'].includes(gesture)){
  const cheek=smooth((y-(neck-15))/5)*head;dx+=side*cheek*strength*(gesture==='horn-snort'?1.2:.6);dy-=head*strength*.8;
 }
 if(gesture==='dragon-roar'){
  const wing=outer*smooth((y-20)/6)*smooth((38-y)/8);dx+=side*wing*strength*2;dy-=wing*strength;dy-=head*strength;
 }
 if(['flower-wings','phoenix-preen','harpy-feathers','moth-antennae','bat-ear-prick'].includes(gesture)){
  const wing=outer*smooth((y-18)/8)*smooth((37-y)/8);dx+=side*wing*strength*1.5;dy+=wing*flick;
 }
 if(gesture==='shell-peek')dy+=head*strength*2;
 if(gesture==='cap-tip')dy+=smooth((27-y)/6)*strength*1.2;
 if(gesture==='shell-kiss')dy+=smooth((25-y)/5)*strength*2;
 if(['jelly-squeeze','mantle-pulse'].includes(gesture)){dx-=side*head*strength*.9;dy+=head*strength;}
 if(['proud-cub','bear-yawn','serpent-hiss','beetle-horn'].includes(gesture))dy-=head*strength*(gesture==='bear-yawn'?1.1:.7);
 if(gesture==='claw-hello'){const claw=smooth((y-27)/5)*smooth((41-y)/6)*outer;dx-=side*claw*strength;dy-=claw*strength;}
 if(gesture==='fish-bubbles'){const fin=outer*smooth((y-24)/6)*smooth((41-y)/8);dy+=fin*flick*1.5;dx+=side*fin*strength;}
 if(gesture==='fang-grin'){const fang=smooth((y-33)/3)*smooth((43-y)/4)*smooth((9-Math.abs(x-32))/4);dx-=side*fang*flick*.8;}
 return {x:dx,y:dy};
}
