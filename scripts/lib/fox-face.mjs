import * as T from 'three';
import {execFileSync} from 'node:child_process';
import {registerHeadExpressions,HEAD_TARGETS} from './fox-head-expressions.mjs';

// One head mesh and a set of eyelids, replacing v1's swap between an open and
// a closed head. Swapping meshes by scale meant every cross-fade between two
// clips blended both heads to partial scale, so the head shrank and popped
// back. Morph weights blend safely: a half-blended blink is a half-closed lid.
//
// The painted eyes sit in recessed sockets, about 0.12 wide and 0.15 tall
// (centre x=±.176, y=1.135 in source units). Each eye gets an upper lid that
// slides down from the socket's top edge and a lower lid that rises to meet
// it, so a blink covers only the eye itself. At weight 0 every lid row lies on
// the socket edge (zero area). Lids follow the actual surface by raycasting
// the source head and take their colour from the fur just outside the eye.
export const EYE={centre:[.176,1.135],radius:[.071,.086]};
export const LID_TARGETS=['Blink','Lid_Angry'];
const UPPER_ROWS=[0,.22,.44,.62,.76,.86,.925,.955,.975,1],LASH=.95,COLUMNS=18;

export function addFoxFace(glb,bones,sourcePositions,positions,normals,sourceIndices,sourceUV,headPosition){
 const {json:g,append}=glb,head=[],body=[];
 for(let n=0;n<sourceIndices.length;n+=3){const tri=Array.from(sourceIndices.subarray(n,n+3));(tri.every(i=>sourcePositions[i*3+1]>.99)?head:body).push(...tri);}
 g.meshes[0].primitives[0].indices=append(new Uint16Array(body),'SCALAR',5123,34963);
 const local=Float32Array.from(positions,(v,i)=>v-headPosition[i%3]);
 const points=Array.from({length:sourcePositions.length/3},(_,i)=>new T.Vector3().fromArray(sourcePositions,i*3));
 const faceMesh=g.meshes.push({name:'FoxHead',weights:HEAD_TARGETS.map(()=>0),extras:{targetNames:HEAD_TARGETS},primitives:[{targets:registerHeadExpressions(glb,points,normals),attributes:{POSITION:append(local,'VEC3',5126,34962),NORMAL:append(normals,'VEC3',5126,34962),TEXCOORD_0:append(sourceUV,'VEC2',5126,34962)},indices:append(new Uint16Array(head),'SCALAR',5123,34963),material:0}]})-1;
 const face=g.nodes.push({name:'Fox_Head',mesh:faceMesh})-1;
 g.nodes[bones.get('Head')].children??=[];g.nodes[bones.get('Head')].children.push(face);

 // Raycast the source head (source units) for the surface under each lid point.
 const geometry=new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(Float32Array.from(sourcePositions),3)).setAttribute('normal',new T.BufferAttribute(Float32Array.from(normals),3)).setAttribute('uv',new T.BufferAttribute(Float32Array.from(sourceUV),2));geometry.setIndex(head);
 const target=new T.Mesh(geometry,new T.MeshBasicMaterial({side:T.DoubleSide})),ray=new T.Raycaster();
 function surface(x,y){ray.set(new T.Vector3(x,y,2),new T.Vector3(0,0,-1));const hit=ray.intersectObject(target)[0];if(!hit)throw Error(`No head surface at ${x},${y}`);const n=new T.Vector3();for(const [k,id]of ['a','b','c'].entries())n.addScaledVector(new T.Vector3().fromArray(normals,hit.face[id]*3),hit.barycoord.getComponent(k));n.normalize();return {point:hit.point.clone().addScaledVector(n,.0032),normal:n,uv:[hit.uv.x,hit.uv.y]};}

 const [cx,cy]=EYE.centre,[ax,ay]=EYE.radius,base=[],blink=[],angry=[],normalsOut=[],samples=[],lash=[],index=[];
 const columns=Array.from({length:COLUMNS+1},(_,i)=>-Math.cos(Math.PI*i/COLUMNS));
 for(const sign of [1,-1])for(const lid of ['upper','lower']){
  const first=base.length;
  for(const u of columns){
   // u runs from the inner (nose) corner, -1, to the outer corner, +1.
   const x=sign*(cx+ax*u),half=ay*Math.sqrt(Math.max(0,1-u*u)),top=cy+half,bottom=cy-half;
   // Closed, the lids meet on a gentle curve a third of the way down, which
   // runs into both corners; angry, the upper lid slants down toward the nose.
   const closed=cy-.30*half,angryLine=lid==='upper'?top-lerp(.42,.08,(u+1)/2)*(top-bottom):bottom+.15*(top-bottom);
   const edge=lid==='upper'?top:bottom,colourY=lid==='upper'?top+.016:bottom-.012;
   const rows=lid==='upper'?UPPER_ROWS:UPPER_ROWS.slice(0,6).map(v=>v/UPPER_ROWS[5]);
   // Average a short arc of fur beside the lid edge, so the lid is one even tone.
   for(const dx of [-.012,0,.012])for(const dy of [0,lid==='upper'?.010:-.008])samples.push(surface(x+dx,colourY+dy).uv);
   for(const v of rows){
    const rest=surface(x,edge),shut=surface(x,lerp(edge,closed,v)),cross=surface(x,lerp(edge,angryLine,v));
    base.push(rest.point);blink.push(shut.point);angry.push(cross.point);normalsOut.push(shut.normal);lash.push(lid==='upper'&&v>=LASH);
   }
  }
  const rowsPerColumn=lid==='upper'?UPPER_ROWS.length:6;
  for(let c=0;c<COLUMNS;c++)for(let r=0;r<rowsPerColumn-1;r++){
   const a=first+c*rowsPerColumn+r,b=a+rowsPerColumn,c1=a+1,d=b+1;
   // Front-facing (+Z) winding for both eyes and both lids.
   const flip=(sign>0)===(lid==='upper');
   index.push(...(flip?[a,c1,b,b,c1,d]:[a,b,c1,b,d,c1]));
  }
 }
 const rgb=JSON.parse(execFileSync('python',['scripts/lib/sample-glb-texture.py'],{input:JSON.stringify({file:'public/meshy-fox-preview/fox-repaired.glb',uvs:samples}),maxBuffer:4*1024*1024}));
 const toLinear=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};
 const colours=new Float32Array(base.length*3),PER=6,columnColour=[];let vertex=0;
 for(let column=0;column<rgb.length/3/PER;column++){const sum=[0,0,0];for(let k=0;k<PER;k++)for(let c=0;c<3;c++)sum[c]+=toLinear(rgb[(column*PER+k)*3+c])/PER;columnColour.push(sum);}
 // Then smooth along each lid over neighbouring columns.
 const run=COLUMNS+1;let column=0;
 for(const sign of [1,-1])for(const lid of ['upper','lower']){const rows=lid==='upper'?UPPER_ROWS.length:6,first=column;for(let c=0;c<run;c++,column++){const fur=[0,0,0];let n=0;for(let k=Math.max(0,c-2);k<=Math.min(run-1,c+2);k++,n++)for(let i=0;i<3;i++)fur[i]+=columnColour[first+k][i];for(let i=0;i<3;i++)fur[i]/=n;for(let r=0;r<rows;r++,vertex++)colours.set(lash[vertex]?[.012,.006,.004]:fur,vertex*3);}}
 const toLocal=p=>[p.x-headPosition[0],p.y-.096-headPosition[1],p.z-headPosition[2]];
 const basePositions=Float32Array.from(base.flatMap(toLocal)),delta=list=>Float32Array.from(list.flatMap(toLocal),(v,i)=>v-basePositions[i]);
 const lidMaterial=g.materials.push({name:'Eyelid fur',pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:0,roughnessFactor:.85}})-1;
 const lidMesh=g.meshes.push({name:'Eyelids',weights:[0,0],extras:{targetNames:LID_TARGETS},primitives:[{attributes:{POSITION:append(basePositions,'VEC3',5126,34962),NORMAL:append(Float32Array.from(normalsOut.flatMap(n=>n.toArray())),'VEC3',5126,34962),COLOR_0:append(colours,'VEC3',5126,34962)},indices:append(new Uint16Array(index),'SCALAR',5123,34963),material:lidMaterial,targets:[{POSITION:append(delta(blink),'VEC3',5126,34962)},{POSITION:append(delta(angry),'VEC3',5126,34962)}]}]})-1;
 const lids=g.nodes.push({name:'Eyelids',mesh:lidMesh})-1;g.nodes[bones.get('Head')].children.push(lids);
 return {face,lids,headTargets:HEAD_TARGETS,lidTargets:LID_TARGETS};
}
const lerp=(a,b,t)=>a+(b-a)*t;
