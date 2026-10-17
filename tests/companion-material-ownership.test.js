import test from 'node:test';
import assert from 'node:assert/strict';
import {authoredSourceFrame} from '../authored-sprite-renderer.js';
import {authoredParts} from '../authored-parts.js';

test('minotaur upper arms retain the authored brown fur in every form and facing',()=>{
 // Reviewed mid-arm fur landmarks, left X/Y then right X/Y. These are
 // painted shaft pixels, rather than fists that bypass material ownership.
 const probes=[
  [[25,32,40,31],[24,32,40,30],[23,32,41,32],[23,31,40,32],[24,31,39,32],[24,31,41,31],[23,32,41,30],[23,31,39,31]],
  [[22,28,43,27],[21,28,44,27],[19,28,45,28],[19,27,43,28],[20,26,41,28],[22,28,43,27],[19,28,44,28],[20,27,41,28]],
  [[22,27,44,26],[20,27,45,26],[19,27,46,27],[19,27,43,27],[20,25,41,27],[21,27,44,26],[18,27,45,27],[19,26,42,27]],
 ];
 for(let stage=0;stage<3;stage++)for(let dir=0;dir<8;dir++){
  const source=authoredSourceFrame('minotaur',dir,stage),parts=authoredParts(source,'minotaur',stage,dir),points=probes[stage][dir];
  for(const [ordinal,side]of [-1,1].entries()){
   const x=points[ordinal*2],y=points[ordinal*2+1],p=source.pixels.find(p=>p.x===x&&p.y===y);assert.ok(p);assert.ok(p.rgb[0]>p.rgb[1]*1.5&&p.rgb[1]>p.rgb[2]*1.4,'original ochre material');
   const arm=parts.arms.profiles.get(side),retained=arm.grid.get(y*64+x);assert.ok(retained,`minotaur ${stage} ${dir} ${side}: painted upper arm belongs to its moving layer`);assert.equal(retained.index,p.index);assert.ok(!parts.body.some(q=>q.x===x&&q.y===y&&!q.bodyUnderlay),'no frozen duplicate arm remains in the torso');
  }
 }
});
