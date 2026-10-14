import test from 'node:test';
import assert from 'node:assert/strict';
import {PIXEL_SPECIES,pixelSpec} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintAtlasCharacter} from '../authored-sprite-renderer.js';
import {spritePoint} from '../prototype-pixel-art.js';

// Render the body by itself: moving hands/weapons cannot conceal a missing
// costume pixel and make this test pass accidentally.
class BodyBrush{
 constructor(){this.data=new Uint8ClampedArray(64*64*4);}
 dot(x,y,color){x=Math.round(x);y=Math.round(y);if(x>=0&&x<64&&y>=0&&y<64)this.data.set([...color.slice(1).match(/../g).map(c=>parseInt(c,16)),255],(y*64+x)*4);}
 rect(x,y,w,h,c){for(let j=Math.round(y);j<Math.round(y+h);j++)for(let i=Math.round(x);i<Math.round(x+w);i++)this.dot(i,j,c);}
 line(a,z,c){const n=Math.max(1,Math.ceil(Math.hypot(z.x-a.x,z.y-a.y)*2));for(let i=0;i<=n;i++)this.dot(a.x+(z.x-a.x)*i/n,a.y+(z.y-a.y)*i/n,c);}
}
function body(spec,evolution,phase,dir,extra={}){
 const rig=nativePoseRig(spec,{id:spec.id,evolution,evolutionPath:'wild',...extra},'attack',phase),brush=new BodyBrush(),angle=dir*Math.PI/4;
 rig.dir=dir;paintAtlasCharacter(brush,spec.nativeRig,rig,q=>spritePoint(q,angle));return {rig,pixels:brush.data};
}

test('uncovered body pixels remain opaque without arms or weapons through a complete swing',()=>{
 let repaired=0;
 for(const spec of PIXEL_SPECIES.filter(s=>['knight','orc','elf','caster','fox'].includes(s.nativeRig)))for(const evolution of [0,1,2])for(let dir=0;dir<8;dir++){
  let source;
  for(const phase of [.12,.34,.46,.65,.82]){
   const {rig,pixels}=body(spec,evolution,phase,dir),repairs=rig.artBodyRepairs;
   const coordinates=repairs.map(p=>p.source);if(source)assert.deepEqual(coordinates,source,'stable body layer through motion');else source=coordinates;
   for(const p of repairs){
    assert.equal(pixels[(Math.round(p.y)*64+Math.round(p.x))*4+3],255,`${spec.id} ${evolution} ${dir} ${phase}: uncovered costume`);
    repaired++;
   }
  }
 }
 assert.ok(repaired>1000,'exercises real uncovered body areas');
});

test('Brakk reveals leather clothing under his raised arms instead of duplicate green hand pixels',()=>{
 const {rig}=body(pixelSpec('brakk'),0,.46,1),repairs=rig.artBodyRepairs.filter(p=>p.source.y>=33);
 assert.ok(repairs.length>0);
 for(const p of repairs){const [r,g,b]=p.color.slice(1).match(/../g).map(c=>parseInt(c,16));assert.ok(!(g>r*.95&&g>b*1.2),'clothing rather than skin');}
});

test('the completed body keeps its palette when equipment changes',()=>{
 for(const id of ['brakk','aurel','tarka','brom','mossguard'])for(const evolution of [0,1,2]){
  const spec=pixelSpec(id),plain=body(spec,evolution,.46,1),equipped=body(spec,evolution,.46,1,{equipment:['sunsteel-edge','mooncloth-mantle','reliquary-plate']});
  const materials=r=>r.rig.artBodyRepairs.map(p=>({source:p.source,color:p.color}));
  assert.deepEqual(materials(equipped),materials(plain),id+' completed body material');
 }
});
