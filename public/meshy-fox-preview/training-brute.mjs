import * as T from 'three';

// A stand-in body for a game melee creature (Brakk in the recorded skirmish):
// a bark-and-stone brute built from primitives with real joints. It holds no
// rules of its own. A replay drives it each frame with the game's state
// (position, facing, speed, the current strike or roll and its progress,
// staggers and the knockout), and it turns that into a readable pose:
// distance-driven gait (no skating feet), overhead slams and side sweeps
// that raise through the game's windup and swing through its contact phase,
// a braced cast, a crouched dodge roll, spring flinches from each arrow,
// telegraph sectors on the ground and a collapse when beaten.
export const BRUTE_BODY={height:1.45,stride:.62};
const smooth=(a,b,t)=>{const x=Math.min(1,Math.max(0,(t-a)/(b-a)));return x*x*(3-2*x);};
const mat=(color,o={})=>new T.MeshStandardMaterial({color,roughness:.85,...o});

export function createBrute(scene,{height=BRUTE_BODY.height}={}){
 const bark=mat('#6d4a33'),barkDark=mat('#4f3424'),moss=mat('#5c7a3a',{roughness:.95}),stone=mat('#8c8a82',{roughness:.7}),eyeMat=mat('#ffb347',{emissive:new T.Color('#ff8a1f'),emissiveIntensity:1.2,roughness:.4});
 const mesh=(geometry,material,parent,p=[0,0,0],r=[0,0,0],s=[1,1,1])=>{const m=new T.Mesh(geometry,material);m.position.set(...p);m.rotation.set(...r);m.scale.set(...s);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
 const group=(parent,p=[0,0,0],name='')=>{const g=new T.Group();g.name=name;g.position.set(...p);parent.add(g);return g;};
 const root=group(scene,[0,0,0],'Brute'),body=group(root,[0,0,0],'body'),hips=group(body,[0,.52,0],'hips'),torso=group(hips,[0,.04,0],'torso'),head=group(torso,[0,.66,.02],'head');
 body.scale.setScalar(height/BRUTE_BODY.height);
 mesh(new T.CylinderGeometry(.27,.31,.60,18),bark,torso,[0,.30,0]);
 mesh(new T.SphereGeometry(.30,18,10,0,Math.PI*2,0,Math.PI/2),moss,torso,[0,.58,0],[0,0,0],[1.05,.45,1.0]);
 for(const [x,y,z]of [[.18,.20,.24],[-.2,.36,.22],[.05,.12,.29]])mesh(new T.BoxGeometry(.06,.14,.02),barkDark,torso,[x,y,z],[0,Math.atan2(x,z),.2]);
 mesh(new T.SphereGeometry(.17,18,12),stone,head,[0,.10,0],[0,0,0],[1.1,.9,1]);
 mesh(new T.BoxGeometry(.30,.06,.10),barkDark,head,[0,.18,.12],[.25,0,0]);
 for(const x of [-.065,.065])mesh(new T.SphereGeometry(.028,10,8),eyeMat,head,[x,.11,.155]);
 for(const s of [-1,1])mesh(new T.ConeGeometry(.035,.16,8),barkDark,head,[s*.12,.25,-.02],[0,0,-s*.5]);
 const arms=[-1,1].map(s=>{const shoulder=group(torso,[s*.34,.48,0],'shoulder');mesh(new T.CapsuleGeometry(.085,.20,6,10),bark,shoulder,[0,-.15,0]);const elbow=group(shoulder,[0,-.30,0],'elbow');mesh(new T.CapsuleGeometry(.095,.18,6,10),bark,elbow,[0,-.13,0]);mesh(new T.DodecahedronGeometry(.13,1),stone,elbow,[0,-.30,.01]);return {side:s,shoulder,elbow};});
 const legs=[-1,1].map(s=>{const hip=group(hips,[s*.15,0,0],'hip');mesh(new T.CapsuleGeometry(.10,.14,6,10),barkDark,hip,[0,-.13,0]);const knee=group(hip,[0,-.27,0],'knee');mesh(new T.CapsuleGeometry(.09,.12,6,10),barkDark,knee,[0,-.12,0]);mesh(new T.BoxGeometry(.18,.08,.27),stone,knee,[0,-.24,.04]);return {side:s,hip,knee};});
 // Telegraph: a ground sector over the strike's reach and arc, filling as
 // the windup runs; dust where a strike lands.
 const warnMaterial=new T.MeshBasicMaterial({color:'#ff6b3d',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}),fillMaterial=warnMaterial.clone();
 let warn=null,fill=null,sector='';
 const shapeSector=(inner,outer,arc)=>{const key=[inner,outer,arc].map(v=>v.toFixed(3)).join();if(key===sector)return;sector=key;warn?.removeFromParent();fill?.removeFromParent();
  warn=new T.Mesh(new T.RingGeometry(Math.max(.01,outer-.05),outer,40,1,-Math.PI/2-arc,2*arc),warnMaterial);fill=new T.Mesh(new T.RingGeometry(inner,outer,40,1,-Math.PI/2-arc,2*arc),fillMaterial);
  for(const m of [warn,fill]){m.rotation.x=-Math.PI/2;scene.add(m);}warn.position.y=.007;fill.position.y=.006;};
 shapeSector(.2,1,.5);
 const dust=new T.Mesh(new T.RingGeometry(.2,.32,40),new T.MeshBasicMaterial({color:'#d8c9a8',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));dust.rotation.x=-Math.PI/2;dust.position.y=.01;scene.add(dust);
 const s={phase:0,flinch:new T.Vector3(),rate:new T.Vector3(),glow:0,dustAge:9,dustAt:new T.Vector3()};
 const brute={root,torso,head,arms,legs,state:s,
  chest(){return torso.localToWorld(new T.Vector3(0,.34,0));},
  headPoint(){return head.localToWorld(new T.Vector3(0,.10,0));},
  // An arrow hit: a spring impulse away from its flight, and a brief glow.
  hit(direction,big=false){const local=direction.clone().applyAxisAngle(new T.Vector3(0,1,0),-root.rotation.y);s.rate.x+=(big?5:3.2)*Math.sign(local.z||1);s.rate.z+=-(big?3:2.2)*local.x;s.rate.y+=.8*(local.x>0?-1:1);s.glow=1;},
  impact(point){s.dustAge=0;s.dustAt.copy(point);},
  // Pose for one frame. state: {position,yaw,speed,dt,action,stagger,dead}
  // where action = {kind:'strike'|'cast'|'roll', p (0..1 of windup), recover
  // (0..1 after contact), style, charged, sector:{outer,arc}, dir (-1..1)}.
  drive({position,yaw,speed=0,dt=1/60,action=null,stagger=0,dead=-1}){
   root.position.copy(position);root.rotation.y=yaw;s.phase+=(speed*dt/BRUTE_BODY.stride)*Math.PI*2;s.glow=Math.max(0,s.glow-dt*3);s.dustAge+=dt;
   const w=11,z=.32;s.rate.addScaledVector(s.flinch,-w*w*dt).addScaledVector(s.rate,-2*z*w*dt);s.flinch.addScaledVector(s.rate,dt);
   const walk=Math.min(1,speed/.25),charge=Math.min(1,Math.max(0,(speed-1.2)/1.2)),ph=s.phase,deadT=dead>=0?smooth(0,1.1,dead):0;
   let up=0,slam=0,side=0,lean=0,crouch=0,brace=0,roll=0,rollDir=0,warning=0;
   if(action?.kind==='strike'){const p=action.p,r=action.recover||0,raise=smooth(0,.72,p),swing=smooth(.72,1,p),relax=1-smooth(0,1,r);
    if(action.style==='side'){side=(raise*.6+.4*swing)*relax;lean=(-.10*raise+.45*swing)*relax;crouch=.06*(raise+swing)*relax;}
    else{up=raise*(1-swing)*relax;slam=swing*relax;lean=(-.22*raise*(1-swing)+.40*swing)*relax;crouch=(.05*raise+.07*swing)*relax;}
    warning=r>0?0:smooth(0,.9,p);}
   else if(action?.kind==='cast'){brace=smooth(0,.6,action.p)*(1-smooth(0,1,action.recover||0));}
   else if(action?.kind==='roll'){roll=Math.sin(Math.PI*Math.min(1,action.p));rollDir=action.dir||0;}
   const bob=Math.abs(Math.sin(ph))*.035*walk,stride=.31+.12*charge;
   hips.position.set(Math.sin(ph)*.025*walk+rollDir*.04*roll,.52+bob-crouch-.16*roll-.30*deadT,0);hips.rotation.set(.10*charge*walk+.25*roll,0,Math.sin(ph)*.06*walk-rollDir*.35*roll);
   legs.forEach((l,i)=>{const p=ph+i*Math.PI,lift=Math.max(0,Math.sin(p+Math.PI/2));l.hip.rotation.x=-stride*Math.sin(p)*walk-crouch*1.6-.7*roll-1.2*deadT;l.knee.rotation.x=.75*lift*walk+crouch*2.6+1.3*roll+1.9*deadT;});
   torso.rotation.set(lean-.18*brace+s.flinch.x*.14+.08*charge*walk-.25*stagger-1.25*deadT,s.flinch.y*.12+Math.sin(ph)*.05*walk+.9*side-1.6*side*(action?.p>.72?smooth(.72,1,action.p):0),s.flinch.z*.14+.12*stagger*Math.sin(ph*3));
   head.rotation.set(-.15*lean+.20*brace+s.flinch.x*.10+.5*deadT,-s.flinch.y*.1,.25*deadT);
   arms.forEach(a=>{const sw=Math.sin(ph+(a.side<0?Math.PI:0))*.45*walk*(1-up)*(1-slam)*(1-side),sweep=a.side>0?side:side*.4;
    a.shoulder.rotation.set(sw-2.75*up-.95*slam-.7*brace-1.3*sweep+.2*deadT,a.side*.5*sweep,a.side*(.12+.15*up-.08*slam+.55*brace)+a.side*.6*deadT);
    a.elbow.rotation.set(-(.35+.25*walk)*(1-up)*(1-slam)*(1-side)-.95*up-.15*slam-.5*brace-.25*sweep,0,0);});
   const glow=action?.kind==='strike'?(action.charged?1.6:1)*warning:0;eyeMat.emissiveIntensity=(1.2+2.8*glow+2.5*s.glow+1.5*brace)*(1-deadT);
   bark.emissive.setRGB(.20*s.glow*s.glow,.05*s.glow*s.glow,.01*s.glow*s.glow);
   if(action?.kind==='strike'&&action.sector){const {inner=.15,outer,arc}=action.sector;shapeSector(inner,outer,arc);warn.position.set(position.x,.007,position.z);fill.position.set(position.x,.006,position.z);warn.rotation.z=fill.rotation.z=yaw;
    warnMaterial.opacity=.85*warning;fillMaterial.opacity=(action.charged?.32:.2)*warning;warnMaterial.color.set(action.charged?'#ff3d2e':'#ff8a3d');fillMaterial.color.copy(warnMaterial.color);}
   else{warnMaterial.opacity=0;fillMaterial.opacity=0;}
   const d=Math.min(1,s.dustAge/.45);dust.position.set(s.dustAt.x,.01,s.dustAt.z);dust.scale.setScalar(.6+2.2*d);dust.material.opacity=.7*(1-d)*(s.dustAge<.45?1:0);
   root.updateMatrixWorld(true);
  },
  reset(){s.phase=0;s.flinch.set(0,0,0);s.rate.set(0,0,0);s.glow=0;s.dustAge=9;},
 };
 return brute;
}
