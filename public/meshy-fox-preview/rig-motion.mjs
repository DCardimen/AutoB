// These are articulation checks, not a locomotion or cloth simulation.
// Four-second loops are baked into the downloadable GLB as well as the viewer.
export function rigRotations(mode,time){
  const r={},phase=time*Math.PI/2;
  if(mode==='rest')return r;
  for(const side of ['R','L']){const sign=side==='R'?1:-1;r['UpperArm_'+side]=[0,0,sign*.95];r['Forearm_'+side]=[0,-sign*.15,0];}
  for(let i=0;i<6;i++)r[`Tail_${String(i).padStart(2,'0')}`]=[.04*Math.sin(phase-i*.5),.10*Math.sin(phase-i*.5),.07*Math.sin(phase-i*.5)];
  if(mode==='joints'){
    r.Head=[0,.22*Math.sin(phase),.07*Math.sin(phase)];
    for(const side of ['R','L']){const sign=side==='R'?1:-1;r['Forearm_'+side]=[0,-sign*(.65+.45*Math.sin(phase)),0];r['Thigh_'+side]=[sign*.25*Math.sin(phase),0,0];r['Shin_'+side]=[.3*Math.max(0,sign*Math.sin(phase)),0,0];}
  }
  return r;
}
