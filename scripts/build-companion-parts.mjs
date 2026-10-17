import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {png} from './animation-artifacts.mjs';
import {authoredIdentities,authoredSourceFrame} from '../authored-sprite-renderer.js';
import {authoredParts} from '../authored-parts.js';
import {NATURAL_ANATOMY,naturalHeadWeight} from '../companion-anatomy.js';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {creatureLegArt} from '../creature-leg-volume.js';

const out=path.resolve(process.argv.find(arg=>arg.startsWith('--out='))?.slice(6)||'playtest-artifacts/companion-parts');fs.mkdirSync(out,{recursive:true});
const hash=value=>createHash('sha256').update(value).digest('hex');
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
  const partCounts=Object.fromEntries(Object.entries(layers).map(([name,rgba])=>{let count=0;for(let y=0;y<64;y++)for(let x=dir*64;x<(dir+1)*64;x++)if(rgba[(y*512+x)*4+3])count++;return [name,count];}));
  const absenceReasons=Object.fromEntries(Object.entries(partCounts).filter(([,count])=>!count).map(([name])=>[name,name.includes('arm')?'No independent hand rig; painted appendages remain in the body/locomotor skin.':name==='cape'?'No separate painted cape in this facing.':name==='legs'?'This body plan has no separately painted walking feet in this facing.':'Source region is occluded in this facing.']));
  frames.push({dir,sourceHash:hash(JSON.stringify(asset.pixels.map(p=>[p.x,p.y,p.index]))),paletteHash:hash(asset.colors.join(',')),registration:parts?.registration||NATURAL_ANATOMY[identity],resolvedHands:parts?.hands,exportTransform:{fit,ox,oy},partCounts,absenceReasons,repairs:parts?.repairs.length||0,legs:legArt?.limbs});
 }
 const files={};for(const [name,rgba]of Object.entries(layers)){const file=`${identity}-form-${stage}-${name}.png`,data=png(512,64,rgba);fs.writeFileSync(path.join(out,file),data);files[name]={file,sha256:hash(data)};}
 families.push({identity,stage,files,frames});
}
const manifest={schema:2,directions:['E','SE','S','SW','W','NW','N','NE'],cell:64,families:authoredIdentities.length,forms:3,sourceFrames:families.length*8,entries:families};fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Generated ${families.length} form sets, ${manifest.sourceFrames} directional frames and ${families.length*8} independent part strips in ${out}`);
