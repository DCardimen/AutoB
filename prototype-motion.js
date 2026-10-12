// Authored, periodic pose tracks. Ground IK supplies the actual contact points;
// these curves supply landing compression, support-side balance and spine rhythm.
const TAU=Math.PI*2;
export const MOTION_PROFILES={
  serpent:{sway:1.1,arm:0,runArm:0,sprintArm:0,landing:.25,spine:.08},
  flyer:{sway:.4,arm:0,runArm:0,sprintArm:0,landing:.2,spine:.025},
  knight:{sway:1.1,arm:5.5,runArm:9,sprintArm:12,landing:1,spine:0.035},
  orc:{sway:1.65,arm:2.5,runArm:4,sprintArm:5,landing:1.3,spine:0.025},
  elf:{sway:0.9,arm:6.5,runArm:10.5,sprintArm:14,landing:0.85,spine:0.045},
  caster:{sway:1.0,arm:5,runArm:8,sprintArm:10,landing:0.95,spine:0.035},
  fox:{sway:0.8,arm:5,runArm:8,sprintArm:11,landing:0.8,spine:0.045},
  mech:{sway:0.65,arm:0,runArm:0,sprintArm:0,landing:0.5,spine:0.025},
  spider:{sway:0.3,arm:0,runArm:0,sprintArm:0,landing:0.35,spine:0.03},
  jelly:{sway:0.3,arm:0,runArm:0,sprintArm:0,landing:0.5,spine:0.025},
  wolf:{sway:0.35,arm:0,runArm:0,sprintArm:0,landing:0.7,spine:0.055},
};
const walk=[[0,0.45],[0.12,-0.65],[0.3,0.35],[0.5,0.45],[0.62,-0.65],[0.8,0.35],[1,0.45]];
const run=[[0,0.5],[0.1,-1.1],[0.32,0.4],[0.47,1.4],[0.5,0.5],[0.6,-1.1],[0.82,0.4],[0.97,1.4],[1,0.5]];
const sprint=[[0,0.5],[0.1,-1.2],[0.24,-0.2],[0.43,1.55],[0.5,0.5],[0.6,-1.2],[0.74,-0.2],[0.93,1.55],[1,0.5]];
const gallop=[[0,-0.6],[0.12,-1.2],[0.28,0.1],[0.45,1.6],[0.5,-0.7],[0.62,-1.1],[0.78,0.4],[0.95,2],[1,-0.6]];
export function samplePoseTrack(track,phase){
  const p=((phase%1)+1)%1;
  for(let i=1;i<track.length;i++)if(p<=track[i][0]){const a=track[i-1],b=track[i],t=(p-a[0])/(b[0]-a[0]),s=t*t*(3-2*t);return a[1]+(b[1]-a[1])*s;}
  return track[0][1];
}
export function locomotionPose(id,phase,runBlend=0,sprintBlend=0){
  const p=MOTION_PROFILES[id],wave=Math.sin(phase*TAU),arm=p.arm+(p.runArm-p.arm)*runBlend+(p.sprintArm-p.runArm)*sprintBlend;
  let bob=samplePoseTrack(walk,phase)*(1-runBlend)+samplePoseTrack(run,phase)*runBlend;
  if(id==='wolf')bob=bob*(1-sprintBlend)+samplePoseTrack(gallop,phase)*sprintBlend;
  else bob=bob*(1-sprintBlend)+samplePoseTrack(sprint,phase)*sprintBlend;
  return {bob:bob*p.landing,sway:-wave*p.sway,arm:Math.cos(phase*TAU)*arm,
    yaw:wave*(p.spine+runBlend*0.025),pitch:id==='wolf'?Math.sin(phase*TAU+0.5)*sprintBlend*0.045:0,
    spine:id==='wolf'?Math.cos(phase*TAU)*sprintBlend*4:0};
}
