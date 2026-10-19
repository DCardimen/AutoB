import test from 'node:test';
import assert from 'node:assert/strict';
import {poseAt} from '../public/fox-layered-preview/model.mjs';
test('short base-fox legs reach planted boots without sideways knee curls at every stride setting',()=>{
 for(const stride of [.5,1,1.5])for(const action of ['idle','run','attack'])for(let i=0;i<240;i++){
  const p=poseAt(action,i/240*(action==='run'?.57:action==='attack'?2.35:3.5),{stocky:true,stride});
  assert.ok(p.feet.some(f=>f.support),'at least one boot supports the body');
  for(let n=0;n<2;n++){
   const leg=p.legs[n],foot=p.feet[n];
   assert.ok(Math.abs(leg.end.x-foot.x)<1e-8,'ankle reaches the authored foot target');
   assert.ok(Math.abs(leg.end.y+4-foot.y)<1e-8,'boot sole stays at its physical contact');
   const dx=leg.end.x-leg.root.x,dy=leg.end.y-leg.root.y,length=Math.hypot(dx,dy);
   const bend=Math.abs(dx*(leg.joint.y-leg.root.y)-dy*(leg.joint.x-leg.root.x))/length;
   assert.ok(bend<1.4,'knees remain close to the hip-to-ankle line');
   if(foot.support)assert.equal(foot.y,53);
  }
  assert.deepEqual(p.bow.grip,p.arms.right.grip);
  if(p.bow.engaged)assert.deepEqual(p.bow.draw,p.arms.left.grip);
  for(const arm of [p.arms.right,p.arms.left])assert.ok(Math.abs(Math.hypot(arm.grip.x-arm.end.x,arm.grip.y-arm.end.y)-2.5)<1e-8,'rigid glove retains its wrist-to-palm length');
 }
});
