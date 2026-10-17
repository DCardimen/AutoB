import test from 'node:test';import assert from 'node:assert/strict';
import {nativePosePixels} from '../native-poses.js';import {pixelSpec} from '../native-content.js';
import {characterRig} from '../prototype-rig.js';import {paintCharacterPixels,spritePoint,SPRITE_ART_REVISION} from '../prototype-pixel-art.js';
import {AUTHORED_SPRITES} from '../authored-sprite-data.js';
const heroes=['aurel','brakk','syl','nyra','rowan'];
function colorCount(pixels,hex){const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));let n=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]&&rgb.every((v,k)=>pixels[i+k]===v))n++;return n;}
test('expressive eye clusters are present in front/profile faces and absent from rear faces',()=>{
 assert.equal(SPRITE_ART_REVISION,14);
 // Check iris/pupil clusters in the face band, excluding collars and quivers.
 // A lone dark hair texel is not an eye; front faces have multi-pixel clusters.
 for(const id of ['elf','caster','fox'])for(let dir=0;dir<8;dir++){
  const art=AUTHORED_SPRITES[id];let eyes=0;
  for(let y=14;y<21;y++)for(let x=17;x<47;x++){
   const index=parseInt(art.frames[dir].slice((y*64+x)*2,(y*64+x)*2+2),16);if(!index)continue;
   const [r,g,b]=art.palette[index].match(/../g).map(v=>parseInt(v,16));
   if(id==='elf'?g>r*1.2&&g>b*1.1:id==='caster'?b>g*1.5&&r<90&&b<90:Math.max(r,g,b)<65)eyes++;
  }
  assert.ok(dir<5?eyes>=2:eyes<=1,`${id} ${dir}: ${eyes} eye texels`);
 }
});
test('tiny idle phase changes leave the authored pixel clusters stable',()=>{for(const id of heroes)for(let dir=0;dir<8;dir++){const spec=pixelSpec(id),a=nativePosePixels(spec,{id},'idle',.25,dir),b=nativePosePixels(spec,{id},'idle',.25001,dir);assert.deepEqual(a,b,id+' '+dir+' must not shimmer at a stationary pose');}});
test('the neck and clothed torso stay connected to the head across living animation frames',()=>{for(const id of ['knight','orc','elf','caster','fox'])for(const state of ['idle','walk','run','sprint','attack','cast','dodge','hit'])for(const phase of [.2,.5,.8])for(let dir=0;dir<8;dir++){const rig=characterRig(id,state,phase,['attack','cast'].includes(state)?'windup':''),angle=dir*Math.PI/4,pixels=paintCharacterPixels(id,rig,angle),at=p=>{const s=spritePoint(p,angle);return [Math.round(s.x),Math.round(s.y)];},body=at(rig.body),head=at(rig.head),opaque=(x,y)=>x>=0&&y>=0&&x<64&&y<64&&pixels[(y*64+x)*4+3];assert.ok(opaque(...body));assert.ok(opaque(...head));const visited=new Set(),queue=[body];for(let k=0;k<queue.length;k++){const [x,y]=queue[k],key=y*64+x;if(visited.has(key))continue;visited.add(key);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if((dx||dy)&&opaque(x+dx,y+dy)&&!visited.has((y+dy)*64+x+dx))queue.push([x+dx,y+dy]);}assert.ok(visited.has(head[1]*64+head[0]),`${id} ${state} ${phase} ${dir}: head must remain attached`);}});
