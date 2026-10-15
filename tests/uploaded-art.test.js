import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {UI_ART,GEAR_ART,RELIC_ART} from '../ui-art.js';
import {CREATURE_GEAR} from '../creature-equipment.js';
import {RELICS} from '../game.js';
import {WEARER_RELICS} from '../wearer-relics.js';
import {rewardsShell} from '../rewards-ui.js';

test('all production inventory identities resolve to supplied, nonempty PNG art',()=>{
 for(const g of CREATURE_GEAR)assert.ok(UI_ART[GEAR_ART[g.id]],g.id);
 for(const r of [...RELICS,...WEARER_RELICS])assert.ok(UI_ART[RELIC_ART[r.id]],r.id);
 const manifest=JSON.parse(fs.readFileSync(new URL('../public/ui/uploaded/manifest.json',import.meta.url)));
 const hashes=new Map();
 for(const [name,entry]of Object.entries(manifest)){
  const file=new URL('..'+UI_ART[name],import.meta.url),png=fs.readFileSync(file);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',name);
  assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],entry.size,name);
  if(!hashes.has(entry.source))hashes.set(entry.source,crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+entry.source,import.meta.url))).digest('hex'));
  assert.equal(entry.sha256,hashes.get(entry.source),`unchanged uploaded source: ${entry.source}`);
 }
});

test('reward rendering leaves the settled outcome and inventory untouched',()=>{
 const reward={won:true,gold:31,xp:32,time:25,loot:{claimed:false,drops:[{kind:'capturer',tier:'scout'}]}};
 const before=JSON.stringify(reward),args={...reward,claimed:false,loot:'CACHE',upgrades:'UPGRADE',growth:'GROWTH',capture:'CAPTURE',casualty:'CASUALTY',continueButton:'CONTINUE'};
 const html=rewardsShell(args);
 assert.match(html,/A little treasure/);assert.match(html,/CACHE/);assert.match(html,/UPGRADE/);assert.match(html,/GROWTH/);
 assert.equal((html.match(/class="uploaded-art chest-frame/g)||[]).length,12);
 assert.equal(JSON.stringify(reward),before);
 const defeat=rewardsShell({...args,won:false});assert.match(defeat,/CASUALTY/);assert.doesNotMatch(defeat,/CACHE|UPGRADE|chest-frame/);
});
