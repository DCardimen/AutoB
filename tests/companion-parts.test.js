import test from 'node:test';
import assert from 'node:assert/strict';
import {ARM_ANATOMY,NATURAL_ANATOMY,naturalHeadWeight} from '../companion-anatomy.js';
import {authoredSourceFrame,authoredIdentities} from '../authored-sprite-renderer.js';
import {authoredParts} from '../authored-parts.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';
import {MOUTH_ANATOMY,mouthRegistration} from '../companion-anatomy.js';
import {nativeStrikeOrigin,setNativeContactHeight} from '../native-combat.js';
import {characterRig} from '../prototype-rig.js';
import {nativeFormRig} from '../native-forms.js';

test('every authored family has its own reviewed body plan; every weapon-bearing form has indexed arms and a complete torso',()=>{
 assert.equal(authoredIdentities.length,41);
 for(const identity of authoredIdentities){assert.ok(ARM_ANATOMY[identity]||NATURAL_ANATOMY[identity],identity+' anatomy');
  if(!ARM_ANATOMY[identity])continue;
  for(const stage of [0,1,2])for(let dir=0;dir<8;dir++){
   const asset=authoredSourceFrame(identity,dir,stage),parts=authoredParts(asset,identity,stage,dir),body=new Map(parts.body.map(p=>[p.y*64+p.x,p]));
   assert.equal(parts.arms.profiles.size,2,`${identity} ${stage} ${dir}`);
   for(const [side,arm]of parts.arms.profiles){assert.ok(arm.pixels.length>=3,'painted arm retained');assert.ok(arm.grid.has(arm.end.y*64+arm.end.x),'actual source hand belongs to its arm');
    for(const p of arm.pixels)assert.equal(p.color,asset.colors[p.index],'original arm material');
    for(const p of arm.pixels)if(!arm.occluded&&body.has(p.y*64+p.x))assert.ok(body.get(p.y*64+p.x).bodyUnderlay,'body has its own material behind a moving arm');
   }
   for(const p of parts.repairs){assert.equal(p.color,asset.colors[p.index]);assert.ok(body.has(p.y*64+p.x));}
  }
 }
});
test('bite effects project onto the actual painted mouth for every biting form, facing and character height',()=>{
 const biting=['wolf','feralfox','drake','rodent','turtle','serpent','spider','centipede','bat','fish'];
 for(const identity of biting){
  const spec=PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===identity&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===identity);assert.ok(spec,identity);
  for(const evolution of [0,1,2])for(const height of [.85,1.1])for(let dir=0;dir<8;dir++){
   const source=authoredSourceFrame(identity,dir,evolution),mouth=mouthRegistration(identity,evolution,dir);
   assert.equal(MOUTH_ANATOMY[identity][evolution].length,8);
   if(mouth.visible)assert.ok(source.pixels.some(p=>Math.hypot(p.x-mouth.x,p.y-mouth.y)<=3),`${identity} ${evolution} ${dir}: landmark is on the authored mouth`);
   setNativeContactHeight(height);
   const u={id:spec.id,x:400,y:350,evolution,evolutionPath:'wild',nativeScale:.35,nativeActor:{id:spec.nativeRig,family:spec}};
   const rig=nativeFormRig(spec,u,characterRig(spec.nativeRig,'attack',1,'windup',{swing:'overhead'}),height);
   const pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4),contact=nativeStrikeOrigin(u,{dx:Math.cos(dir*Math.PI/4),dy:Math.sin(dir*Math.PI/4),style:'overhead'},1);
   const screen={x:contact.x,y:contact.y*.58+75-contact.z},expected={x:u.x+(rig.artCreatureMouth.x-32)*3*u.nativeScale,y:u.y*.58+75+(rig.artCreatureMouth.y-44)*3*u.nativeScale};
   assert.ok(Math.hypot(screen.x-expected.x,screen.y-expected.y)<1e-7,`${identity} ${evolution} ${dir}: effect comes from the rendered mouth`);
   if(mouth.visible){const q=rig.artCreatureMouth;let near=false;for(let y=Math.round(q.y)-3;y<=Math.round(q.y)+3;y++)for(let x=Math.round(q.x)-3;x<=Math.round(q.x)+3;x++)if(x>=0&&x<64&&y>=0&&y<64&&pixels[(y*64+x)*4+3])near=true;assert.ok(near,'visible pixels next to contact');}
  }
 }
 setNativeContactHeight(1);
});
test('painted grip pixels remain visible after weapons and shields in every weapon family, form and facing',()=>{
 for(const identity of Object.keys(ARM_ANATOMY)){
  const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===identity&&!s.pixelConverted);assert.ok(spec,identity);
  for(const evolution of [0,1,2])for(const [state,phase]of [['idle',.25],['walk',.62],['attack',.34],['attack',.46],['attack',.65]])for(let dir=0;dir<8;dir++){
   const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,phase),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
   assert.ok(rig.artArmSkin,'authored arm skin in production');assert.equal(pixels.clipped,0);
   const main=rig.arms.find(a=>a.side===(rig.weapon?.hand==='left'?-1:1));if(!main||!rig.weapon)continue;
   const grip=rig.artProject(rig.weapon.grip),hand=rig.artProject(main.end);assert.ok(Math.hypot(grip.x-hand.x,grip.y-hand.y)<1e-7);
   const sourcePixels=rig.artGripPixels.get(main.side)||[];assert.ok(sourcePixels.length,'real indexed fingers, no generated fist');
   // A near hand must remain visible through the final weapon pass. A far
   // hand is correctly allowed to be hidden by the body in profile views.
   const visible=sourcePixels.filter(p=>p.near);if(!visible.length)continue;
   assert.ok(visible.some(p=>{const x=Math.round(p.x),y=Math.round(p.y),n=(y*64+x)*4,color=p.color.slice(1).match(/../g).map(v=>parseInt(v,16));return x>=0&&x<64&&y>=0&&y<64&&pixels[n+3]===255&&color.every((v,i)=>pixels[n+i]===v);}),`${spec.id} ${evolution} ${state} ${dir}: actual fingers over the handle`);
  }
 }
});
test('dragon face belongs to its head, never to a wing; evolved foxes register their longer legs',()=>{
 assert.deepEqual(NATURAL_ANATOMY.feralfox.legHeights,[7,14,14]);assert.equal(NATURAL_ANATOMY.drake.plan,'biped');assert.ok(NATURAL_ANATOMY.drake.lockedTravelHead);
 for(const stage of [0,1,2])for(const dir of [0,1,2,3,4]){
  const [offset,centerY,,neck]=NATURAL_ANATOMY.drake.heads[stage],sign=dir<2?1:dir===2?0:-1,x=32+sign*offset*(dir===0||dir===4?1:.65);
  assert.equal(naturalHeadWeight('drake',stage,dir,x,centerY),1);assert.equal(naturalHeadWeight('drake',stage,dir,x,neck-1),1);
 }
});
test('painted shoulders, elbows and hands remain connected through locomotion, swings, casts and falls in all weapon forms',()=>{
 const connected=(pixels,start,end)=>{
  const occupied=(x,y)=>x>=0&&x<64&&y>=0&&y<64&&pixels[(y*64+x)*4+3]>0;
  const x=Math.round(start.x),y=Math.round(start.y),seen=new Uint8Array(4096),queue=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(occupied(x+dx,y+dy)){const n=(y+dy)*64+x+dx;seen[n]=1;queue.push(n);}
  for(let i=0;i<queue.length;i++){const n=queue[i],xx=n%64,yy=Math.floor(n/64);if(Math.hypot(xx-end.x,yy-end.y)<2)return true;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const k=(yy+dy)*64+xx+dx;if(occupied(xx+dx,yy+dy)&&!seen[k]){seen[k]=1;queue.push(k);}}
  }return false;
 };
 for(const identity of Object.keys(ARM_ANATOMY)){
  const spec=PIXEL_SPECIES.find(s=>s.nativeDesign===identity&&!s.pixelConverted);
  for(const evolution of [0,1,2])for(const state of ['idle','walk','run','attack','cast','death'])for(const phase of [.12,.43,.78])for(let dir=0;dir<8;dir++){
   const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,phase),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4);
   for(const arm of rig.arms)assert.ok(connected(pixels,rig.artArmRoots[arm.side],rig.artProject(arm.end)),`${identity}/${evolution}/${state}/${phase}/${dir}/${arm.side}: shoulder connects to painted hand`);
  }
 }
});
test('phoenix cleanup retains painted flame tips beside removed ground material',()=>{
 for(const [stage,dir,x,index]of [[1,0,10,17],[1,0,14,11],[1,2,44,33],[1,3,44,8],[1,4,46,11],[1,5,44,11],[1,7,19,11],[2,4,44,6],[2,4,46,6],[2,5,40,8],[2,7,23,8]]){
  const source=authoredSourceFrame('phoenix',dir,stage);assert.equal(source.pixels.find(p=>p.x===x&&p.y===44)?.index,index,'original tail/flame palette index at the ground row');
 }
 for(const stage of [1,2])for(let dir=0;dir<8;dir++){
  const ground=new Set(stage===1?[36,40]:[11,39]);assert.ok(!authoredSourceFrame('phoenix',dir,stage).pixels.some(p=>p.y>=44&&ground.has(p.index)));
 }
 const east=authoredSourceFrame('phoenix',0,1),remaining=new Set(east.pixels.map(p=>p.y*64+p.x)),queue=[remaining.values().next().value];remaining.delete(queue[0]);
 for(let i=0;i<queue.length;i++){const x=queue[i]%64,y=Math.floor(queue[i]/64);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,n=yy*64+xx;if(xx>=0&&xx<64&&yy>=0&&yy<64&&remaining.delete(n))queue.push(n);}}
 assert.equal(remaining.size,0,'the neighboring flame is not left floating beside the mature east-facing phoenix');
});
test('wing, fin and face edges keep their original painted connections through complete motion cycles',()=>{
 for(const identity of ['bat','fish','fairy','harpy','owl','phoenix','moth','drake']){
  const design=identity==='fairy'?'faerie':identity,spec=PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===design&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>(s.nativeDesign||s.nativeRig)===design);
  for(const evolution of [0,1,2])for(const state of ['idle','walk','sprint','attack','cast','death'])for(const phase of [.12,.43,.78])for(let dir=0;dir<8;dir++){
   const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild'},state,phase),pixels=paintCharacterPixels(spec.nativeRig,rig,dir*Math.PI/4),source=authoredSourceFrame(identity,dir,rig.artStage),labels=new Uint16Array(4096);let label=0;
   for(let n=0;n<4096;n++)if(pixels[n*4+3]&&!labels[n]){label++;const queue=[n];labels[n]=label;for(let i=0;i<queue.length;i++){const x=queue[i]%64,y=Math.floor(queue[i]/64);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*64+xx;if(xx>=0&&xx<64&&yy>=0&&yy<64&&pixels[k*4+3]&&!labels[k]){labels[k]=label;queue.push(k);}}}}
   const grid=new Map(source.pixels.map(p=>[p.y*64+p.x,p])),component=p=>{const q=rig.artSourcePixels.get(p.y*64+p.x);if(!q)return 0;const x=Math.round(q.x),y=Math.round(q.y);return x>=0&&x<64&&y>=0&&y<64?labels[y*64+x]:0;};
   for(const p of source.pixels)for(const [dx,dy]of [[1,0],[0,1]]){const other=grid.get((p.y+dy)*64+p.x+dx);if(!other||Math.abs(other.x-p.x)>1)continue;assert.ok(component(p)&&component(p)===component(other),`${identity}/${evolution}/${state}/${phase}/${dir}: source edge ${p.x},${p.y} remains connected`);}
  }
 }
});
