import {projectRig} from './prototype-rig.js';
import {legAnatomy,sampleLegMaterial} from './leg-anatomy.js';
import {NATURAL_ANATOMY} from './companion-anatomy.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const ease=n=>{n=clamp(n,0,1);return n*n*(3-2*n);};
export const QUADRUPEDS=new Set(['wolf','feralfox','cat','lion','bear','rhino','stag','rabbit','rodent','turtle']);
const arthropods=new Set(['spider','crab','mantis','beetle','centipede','mech']);

// V3 skins the actual directional artwork. A proxy skeleton describes motion,
// not a replacement silhouette: hidden legs stay hidden, and paws, plating,
// hooves, claws and their exact palette indices remain authored pixels.
export function creatureLegArt(asset,rig,colors=asset.colors){
 const design=rig.design||rig.id;
 asset.creatureSkins??=new Map();if(asset.creatureSkins.has(design))return asset.creatureSkins.get(design);
 const bottom=Math.max(...asset.pixels.map(p=>p.y)),top=Math.min(...asset.pixels.map(p=>p.y));
 const robe=['caster','frostelf','elf','fox','skeleton'].includes(design);
 const height=Math.min((bottom-top)*.36,NATURAL_ANATOMY[design]?.legHeights?.[rig.artStage||0]||legAnatomy(design).height||(robe?5:9)),rootY=bottom-height;
 const occupied=new Set(asset.pixels.map(p=>p.y*64+p.x));
 // Separate the visible terminal branches below the belly. Evaluate several
 // depths: a single scan line misses far feet that end above the near soles.
 let branches=[],score=-Infinity;
 for(let depth=2;depth<=Math.min(7,Math.ceil(height*.7));depth++){
  const remaining=new Set(asset.pixels.filter(p=>p.y>=bottom-depth).map(p=>p.y*64+p.x)),groups=[];
  while(remaining.size){
   const first=remaining.values().next().value,queue=[first],points=[];remaining.delete(first);
   for(let i=0;i<queue.length;i++){const k=queue[i],x=k%64,y=Math.floor(k/64);points.push({x,y});for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy,n=yy*64+xx;if(xx>=0&&xx<64&&yy>=0&&yy<64&&remaining.delete(n))queue.push(n);}}
   if(points.length>=3)groups.push(points);
  }
  const candidates=groups.filter(g=>Math.max(...g.map(p=>p.y))>=bottom-height*.6);
  const value=(candidates.length>=2&&candidates.length<=Math.min(6,rig.legs.length)?100:0)+Math.min(6,candidates.length)*4-depth;
  if(value>score){score=value;branches=candidates;}
 }
 // Broad paws often touch the belly in the lower fringe. Treating that
 // connected region as one foot made bears, lions and rabbits hop as a block.
 // Split its two visible lobes without removing or narrowing any artwork.
 if(branches.length<2&&(QUADRUPEDS.has(design)||rig.legs.length===2)){
  const fringe=asset.pixels.filter(p=>p.y>=bottom-height*.6),left=Math.min(...fringe.map(p=>p.x)),right=Math.max(...fringe.map(p=>p.x)),middle=(left+right)/2;
  const halves=[fringe.filter(p=>p.x<=middle),fringe.filter(p=>p.x>middle)];
  if(right-left>=6&&halves.every(g=>g.length>=3))branches=halves;
 }
 if(!branches.length)branches=[asset.pixels.filter(p=>p.y>=bottom-2)];
 const limbs=branches.map(points=>{
  const sole=Math.max(...points.map(p=>p.y)),tips=points.filter(p=>p.y>=sole-1),x=tips.reduce((s,p)=>s+p.x,0)/tips.length;
  const toe=tips.reduce((best,p)=>Math.abs(p.x-x)<Math.abs(best.x-x)?p:best,tips[0]);
  const width=Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))+1;
  // Socket X follows the original branch towards the body, rather than an
  // arbitrary projected skeleton hip. No pixels are erased at this socket.
  let socket={x:toe.x,y:rootY};
  for(let y=Math.floor(rootY);y<=sole-2;y++){const row=asset.pixels.filter(p=>p.y===y&&Math.abs(p.x-x)<Math.max(3,width*.65));if(row.length){socket=row.reduce((best,p)=>Math.abs(p.x-x)<Math.abs(best.x-x)?p:best,row[0]);break;}}
  return {x:toe.x,sole:toe.y,width,root:{x:socket.x,y:socket.y},pixels:points.length};
 }).sort((a,b)=>a.x-b.x);
 const result={limbs,rootY,bottom,top,height,occupied,arthropod:arthropods.has(design),sourcePixels:asset.pixels.length,materialIndices:sampleLegMaterial({...asset,colors},asset.pixels.filter(p=>p.y>=rootY))};
 asset.creatureSkins.set(design,result);return result;
}

export function skinCreatureLegs(rig,rest,angle,art,bodyDelta){
 const project=q=>{const p=projectRig(q,angle);return {x:p.x/3,y:p.y/3};};
 const bind=rest.legs.map(l=>project(l.end)),xs=bind.map(p=>p.x),left=Math.min(...xs),right=Math.max(...xs);
 const first=art.limbs[0].x,last=art.limbs.at(-1).x,available=new Set(bind.map((_,i)=>i).filter(i=>NATURAL_ANATOMY[rig.design]?.plan!=='biped'||i>=bind.length-2));
 const moving=['walk','run','sprint','turn','stop','dash','dodge'].includes(rig.state),fallen=Boolean(rig.ragdoll);
 const quad=QUADRUPEDS.has(rig.design||rig.id),group=index=>index===0||index===3?0:1;let firstGroup;
 const limbs=art.limbs.map((source,ordinal)=>{
  const tx=left+(source.x-first)/Math.max(1,last-first)*(right-left);
  const candidates=[...available].sort((a,b)=>Math.abs(bind[a].x-tx)-Math.abs(bind[b].x-tx)||bind[b].y-bind[a].y);
  if(quad&&firstGroup===undefined)firstGroup=group(candidates[0]??0);
  // Two visible paws can otherwise bind to the same diagonal pair. Prefer
  // opposite footfall groups for neighboring visible lobes, while retaining
  // the closest depth-correct physical leg within each group.
  const wanted=(firstGroup+ordinal)%2,index=(quad?candidates.find(i=>group(i)===wanted):undefined)??candidates[0]??0;available.delete(index);
  const end=project(rig.legs[index].end),origin=bind[index];
  // Source-relative travel limits keep a short crab leg short even when its
  // locomotion skeleton has a large world-space stride. The existing stride
  // slider still drives the skeleton and therefore these bounded offsets.
  const strideScale=Math.sqrt(clamp((rig.strideLength??100)/100,.5,1.5)),reach=art.height*(art.arthropod?.2:.28)*strideScale,lift=art.height*(art.arthropod?.17:.22);
  const dx=moving||fallen||rig.creatureAttack?.active?clamp((end.x-origin.x)*.65,-reach,reach):0;
  const dy=moving||fallen||rig.creatureAttack?.active?clamp((end.y-origin.y)*.65,-lift,lift):0;
  return {...source,index,delta:{x:dx,y:dy},planted:rig.legs[index].foot?.planted!==false};
 });
 const offset=(x,y)=>{
  if(y<=art.rootY)return bodyDelta;
  // Continuous blend through the entire socket, knee and foot. Adjacent
  // pixels share the same field; there is no hard cut or floating calf.
  let nearest=limbs[0],distance=Infinity;
  for(const l of limbs){const d=Math.abs(x-l.x);if(d<distance){distance=d;nearest=l;}}
  const t=ease((y-art.rootY)/Math.max(2,nearest.sole-art.rootY));
  return {x:bodyDelta.x*(1-t)+nearest.delta.x*t,y:bodyDelta.y*(1-t)+nearest.delta.y*t};
 };
 return {limbs,offset,mode:'authored',sourcePixels:art.sourcePixels,rootY:art.rootY,bottom:art.bottom};
}
