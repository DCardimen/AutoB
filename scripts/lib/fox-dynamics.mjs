import {Vector3,Quaternion} from 'three';
// Constrained point chains with pinned roots, cross-links and fixed 120Hz steps.
// Their solved rotations are baked, so the portable GLB retains the motion.
export class PinnedCloth {
 constructor(columns){this.rest=columns.map(c=>c.map(p=>new Vector3(...p)));this.points=this.rest.map(c=>c.map(p=>p.clone()));this.previous=this.points.map(c=>c.map(p=>p.clone()));this.lengths=this.rest.map(c=>c.slice(1).map((p,i)=>p.distanceTo(c[i])));}
 step(dt,time,acceleration=0,drive=0){
  for(let c=0;c<this.points.length;c++)for(let i=1;i<this.points[c].length;i++){
   const p=this.points[c][i],old=p.clone(),v=p.clone().sub(this.previous[c][i]).multiplyScalar(.93),rest=this.rest[c][i];
   p.add(v);p.addScaledVector(rest.clone().sub(p),dt*dt*95);
   p.x+=dt*dt*(.35*Math.sin(time+c*.7+i*.2)+drive*.8);p.z+=dt*dt*(-1.6-acceleration*5+.5*Math.sin(time*2+i));p.y-=dt*dt*.9;this.previous[c][i].copy(old);
  }
  for(let iteration=0;iteration<8;iteration++){
   for(let c=0;c<this.points.length;c++){
    this.points[c][0].copy(this.rest[c][0]);
    for(let i=1;i<this.points[c].length;i++){const a=this.points[c][i-1],b=this.points[c][i],delta=b.clone().sub(a),error=(delta.length()-this.lengths[c][i-1])/Math.max(delta.length(),1e-7);if(i===1)b.addScaledVector(delta,-error);else{a.addScaledVector(delta,error*.5);b.addScaledVector(delta,-error*.5);}}
   }
   for(let c=1;c<this.points.length;c++)for(let i=1;i<this.points[c].length;i++){const a=this.points[c-1][i],b=this.points[c][i],d=b.clone().sub(a),length=this.rest[c-1][i].distanceTo(this.rest[c][i]),err=(d.length()-length)/Math.max(d.length(),1e-7);a.addScaledVector(d,err*.15);b.addScaledVector(d,-err*.15);}
  }
 }
 rotations(){return this.points.map((c,n)=>c.slice(0,-1).map((p,i)=>new Quaternion().setFromUnitVectors(this.rest[n][i+1].clone().sub(this.rest[n][i]).normalize(),c[i+1].clone().sub(p).normalize())));}
 error(){let max=0;for(let c=0;c<this.points.length;c++)for(let i=1;i<this.points[c].length;i++)max=Math.max(max,Math.abs(this.points[c][i].distanceTo(this.points[c][i-1])-this.lengths[c][i-1]));return max;}
}
