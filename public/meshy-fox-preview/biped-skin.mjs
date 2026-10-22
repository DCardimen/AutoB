import {Matrix4} from 'three';

// The expanded FBX has 250k corners. Three's generic CPU accessor multiplies
// bone matrices per corner; cache the same transforms once per skeleton pose.
// The renderer still uses the original GPU skinning and geometry.
export class BipedSkin{
 constructor(mesh){this.mesh=mesh;const a=mesh.geometry.attributes;this.p=a.position.array;this.j=a.skinIndex.array;this.w=a.skinWeight.array;this.m=mesh.skeleton.bones.map(()=>new Matrix4());}
 update(){const mesh=this.mesh,s=mesh.skeleton;for(let i=0;i<this.m.length;i++)this.m[i].multiplyMatrices(mesh.bindMatrixInverse,s.bones[i].matrixWorld).multiply(s.boneInverses[i]).multiply(mesh.bindMatrix);}
 vertex(id,out){const {p,j,w,m}=this;let x=p[id*3],y=p[id*3+1],z=p[id*3+2];const targets=this.mesh.geometry.morphAttributes.position||[],influences=this.mesh.morphTargetInfluences||[];for(let i=0;i<targets.length;i++){const a=influences[i];if(a){const d=targets[i].array;x+=a*d[id*3];y+=a*d[id*3+1];z+=a*d[id*3+2];}}let px=0,py=0,pz=0;for(let k=0;k<4;k++){const weight=w[id*4+k];if(!weight)continue;const e=m[j[id*4+k]].elements;px+=weight*(e[0]*x+e[4]*y+e[8]*z+e[12]);py+=weight*(e[1]*x+e[5]*y+e[9]*z+e[13]);pz+=weight*(e[2]*x+e[6]*y+e[10]*z+e[14]);}return out.set(px,py,pz);}
}
