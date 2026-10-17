import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {authoredIdentities,authoredSourceFrame} from '../authored-sprite-renderer.js';
import {authoredParts} from '../authored-parts.js';
import {NATURAL_ANATOMY,naturalHeadWeight} from '../companion-anatomy.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {creatureLegArt} from '../creature-leg-volume.js';

const out=path.resolve(process.argv.find(arg=>arg.startsWith('--out='))?.slice(6)||'playtest-artifacts/companion-parts');fs.mkdirSync(out,{recursive:true});
const hash=value=>createHash('sha256').update(value).digest('hex');
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function chunk(type,data){const name=Buffer.from(type),length=Buffer.alloc(4),sum=Buffer.alloc(4);length.writeUInt32BE(data.length);let crc=0xffffffff;for(const n of Buffer.concat([name,data]))crc=crcTable[(crc^n)&255]^(crc>>>8);sum.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([length,name,data,sum]);}
function png(width,height,rgba){const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const raw=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)Buffer.from(rgba.buffer,rgba.byteOffset+y*width*4,width*4).copy(raw,y*(width*4+1)+1);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);}
const families=[];
for(const identity of authoredIdentities)for(const stage of [0,1,2]){
 const spec=PIXEL_SPECIES.find(s=>(s.nativeDesign===(identity==='fairy'?'faerie':identity)||s.nativeRig===identity)&&!s.pixelConverted)||PIXEL_SPECIES.find(s=>s.nativeDesign===(identity==='fairy'?'faerie':identity));
 if(!spec)throw Error('No companion for '+identity);
 const layers=Object.fromEntries(['original','head','torso','left-arm','right-arm','legs','cape','assembled'].map(name=>[name,new Uint8ClampedArray(512*64*4)])),frames=[];
 for(let dir=0;dir<8;dir++){
  const asset=authoredSourceFrame(identity,dir,stage),parts=authoredParts(asset,identity,stage,dir),rig=nativePoseRig(spec,{id:spec.id,evolution:stage,evolutionPath:'wild'},'idle',.25);rig.artStage=stage;
  const legArt=rig.legs.length?creatureLegArt(asset,rig):null,neck=parts?.registration.neck||NATURAL_ANATOMY[identity]?.heads[stage][3]||28,legTop=legArt?.rootY??64;
  const left=Math.min(...asset.pixels.map(p=>p.x)),right=Math.max(...asset.pixels.map(p=>p.x)),top=Math.min(...asset.pixels.map(p=>p.y)),bottom=Math.max(...asset.pixels.map(p=>p.y)),fit=Math.min(1,60/(right-left+1),60/(bottom-top+1)),ox=32-(left+right)/2,oy=Math.max(0,2-top);
  const put=(name,p)=>{const x=Math.round(32+(p.x-32+ox)*fit)+dir*64,y=Math.round(44+(p.y-44+oy)*fit);if(x<dir*64||x>dir*64+63||y<0||y>63)throw Error(`${identity} ${stage} ${dir}: part outside export cell`);layers[name].set([...p.rgb,255],(y*512+x)*4);};
  for(const p of asset.pixels)put('original',p);
  for(const p of parts?.body||asset.pixels){
   const head=parts?p.y<=neck:naturalHeadWeight(identity,stage,dir,p.x,p.y)>.5;
   const cape=parts?.capeMask.has(p.y*64+p.x);
   put(cape?'cape':head?'head':p.y>=legTop?'legs':'torso',p);put('assembled',p);
  }
  if(parts)for(const [side,arm]of parts.arms.profiles)for(const p of arm.pixels){put(side<0?'left-arm':'right-arm',p);put('assembled',p);}
  frames.push({dir,sourceHash:hash(JSON.stringify(asset.pixels.map(p=>[p.x,p.y,p.index]))),paletteHash:hash(asset.colors.join(',')),registration:parts?.registration||NATURAL_ANATOMY[identity],resolvedHands:parts?.hands,exportTransform:{fit,ox,oy},partCounts:parts?{head:parts.head.length,torso:parts.torso.length,leftArm:parts.arms.profiles.get(-1)?.pixels.length||0,rightArm:parts.arms.profiles.get(1)?.pixels.length||0,repairs:parts.repairs.length}:null,legs:legArt?.limbs});
 }
 const files={};for(const [name,rgba]of Object.entries(layers)){const file=`${identity}-form-${stage}-${name}.png`,data=png(512,64,rgba);fs.writeFileSync(path.join(out,file),data);files[name]={file,sha256:hash(data)};}
 families.push({identity,stage,files,frames});
}
const manifest={schema:1,directions:['E','SE','S','SW','W','NW','N','NE'],cell:64,families:authoredIdentities.length,forms:3,sourceFrames:families.length*8,entries:families};fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Generated ${families.length} form sets, ${manifest.sourceFrames} directional frames and ${families.length*8} independent part strips in ${out}`);
