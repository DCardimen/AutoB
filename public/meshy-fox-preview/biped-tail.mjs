import * as T from 'three';
import {FoxTailClearance} from './fox-tail-clearance.mjs';
import {BipedSkin} from './biped-skin.mjs';

export function bipedTailAudit(mesh){
 const g=mesh.geometry,p=g.attributes.position.array,j=g.attributes.skinIndex.array,w=g.attributes.skinWeight.array,names=mesh.skeleton.bones.map(b=>/^Bone_01[5-9]$/.test(b.name)?`Tail_${b.name}`:b.name);
 // FBX expands every triangle corner. Weld identical skinned points for the
 // audit only; the rendered source topology and texture seams stay untouched.
 const canonical=new Map(),remap=[];
 for(let i=0;i<p.length/3;i++){const key=[...p.slice(i*3,i*3+3),...j.slice(i*4,i*4+4),...w.slice(i*4,i*4+4)].join(',');if(!canonical.has(key))canonical.set(key,i);remap.push(canonical.get(key));}
 const originalIndices=g.index?Array.from(g.index.array):Array.from({length:p.length/3},(_,i)=>i),seam=new Set(mesh.userData.tailAttachmentVertices||[]),indices=[];
 // The shared, source-authored socket seam is connected anatomy, rather than
 // a free tail surface. Its exact vertex IDs are recorded by the importer.
 // This affects collision diagnostics only; no rendered triangle is removed.
 for(let i=0;i<originalIndices.length;i+=3){const tri=originalIndices.slice(i,i+3);if(!tri.some(v=>seam.has(v)))indices.push(...tri.map(v=>remap[v]));}
 const skin=new BipedSkin(mesh),audit=new FoxTailClearance(p,Uint32Array.from(indices),j,w,names,(i,out)=>skin.vertex(i,out)),update=audit.update.bind(audit);
 audit.update=()=>{skin.update();update()};audit.skin=skin;audit.unique=[...canonical.values()];return audit;
}

export function bipedTailClear(audit,margin=.00002){
 if(audit.intersects())return false;
 const closest={};audit.parts[0].bvh.closestPointToGeometry(audit.parts[1].geometry,audit.identity,closest,{},margin,margin);
 return closest.distance===undefined||closest.distance>=margin;
}
export function clearBipedTail(audit,bone,update,margin=.00002){
 if(bipedTailClear(audit,margin))return 0;
 const base=bone.quaternion.clone(),axis=new T.Vector3(1,0,0);let low=0,high=0;
 const pose=a=>{bone.quaternion.copy(base).multiply(new T.Quaternion().setFromAxisAngle(axis,a));update()};
 for(const angle of [.06,.12,.20,.30,.45,.60,.80,1.05]){pose(angle);if(bipedTailClear(audit,margin)){high=angle;break;}low=angle;}
 if(!high){
  // A sideways slide rolls the pelvis: its safe hinge direction then includes
  // a lateral swing. Search the same joint's two physical bend axes.
  for(const magnitude of [.16,.28,.42,.60,.80,1.05])for(let i=0;i<12;i++){
   const angle=i*Math.PI/6,rotation=new T.Quaternion().setFromEuler(new T.Euler(Math.cos(angle)*magnitude,0,Math.sin(angle)*magnitude));
   bone.quaternion.copy(base).multiply(rotation);update();if(bipedTailClear(audit,margin))return magnitude;
  }
  throw Error('Supplied biped tail has no clear hinge pose');
 }
 for(let i=0;i<8;i++){const mid=(low+high)/2;pose(mid);if(!bipedTailClear(audit,margin))low=mid;else high=mid;}
 pose(high+.025);return high+.025;
}
