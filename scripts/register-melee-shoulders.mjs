import fs from 'node:fs';
import {PIXEL_SPECIES} from '../native-content.js';
import {nativePoseRig} from '../native-poses.js';
import {paintCharacterPixels} from '../prototype-pixel-art.js';
// E,SE,S,SW,W face/beard exclusions measured on the original 8x grids.
// Rear shoulder caps have no face exclusion; crowns/horns lie above them.
const guards={
 troll:[[29,43,1,20],[26,40,1,20],[25,39,1,20],[22,36,1,20],[20,34,1,20]],
 orc:[[31,43,0,24],[29,42,0,23],[25,39,0,23],[22,36,0,23],[20,33,0,24]],
 dwarf:[[28,40,0,32],[27,39,0,32],[26,37,0,31],[24,36,0,32],[21,31,0,31]],
 minotaur:[[30,44,0,23],[28,41,0,23],[25,39,0,23],[22,36,0,23],[20,34,0,23]]
};
const bulky=new Set(Object.keys(guards));
for(const file of fs.readdirSync('art/melee-layers/masters')){
 const path='art/melee-layers/masters/'+file,m=JSON.parse(fs.readFileSync(path)),spec=PIXEL_SPECIES.find(s=>s.nativeDesign===m.identity&&!s.pixelConverted);
 for(const f of m.facings){
  const rig=nativePoseRig(spec,{id:spec.id,evolution:m.stage,evolutionPath:'wild'},'idle',.25);rig.artStage=m.stage;rig.suppressShoulders=true;paintCharacterPixels(rig.id,rig,f.dir*Math.PI/4);
  for(const a of f.arms){const arm=rig.arms.find(arm=>rig.artArmScreens[arm.side]===a.side),root=rig.artArmRoots[arm.side],end=rig.artLimbPoints.get(arm.end),large=m.stage>0,isBulky=bulky.has(m.identity),inner=a.root.x-a.side*(large?3:2),outer=a.root.x+a.side*(large?(isBulky?15:10):9),top=a.root.y-(large?(isBulky?9:6):3),bottom=a.root.y+(large?8:5);
   a.shoulder={bounds:[Math.min(inner,outer),Math.max(inner,outer),top,bottom],fade:large?3:2,follow:large?(isBulky?.7:.45):(isBulky?.55:.35),rest:[Number(((end.x-root.x)/rig.artCreatureFit).toFixed(5)),Number(((end.y-root.y)/rig.artCreatureFit).toFixed(5))]};
   if(large&&guards[m.identity]?.[f.dir])a.shoulder.protect=guards[m.identity][f.dir];
   else if(f.dir<5){const cx=[36,35,32,28,27][f.dir];a.shoulder.protect=[cx-6,cx+6,0,f.registration.neck+1];}
  }
  f.notes=f.notes.filter(n=>!n.startsWith('Shoulder field:'));
  f.notes.push('Shoulder field: original deltoid/pauldron and backing roll with stable solved arm reach, blended into the fixed clavicle/chest. The driver is independent of elbow-branch and angle-wrap changes. Saved face/beard exclusions preserve the head; no source ownership or palette is changed.');
 }
 fs.writeFileSync(path,JSON.stringify(m,null,2)+'\n');
}
console.log('Registered 336 shoulder envelopes and neutral arm-reach vectors against all 168 original-art cells.');
