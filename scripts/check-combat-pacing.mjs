import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {makeRun,generateRoute,encounter,Battle} from '../game.js';

const results=[];
for(const seed of [337,62,19,81,122]){
 const run=makeRun(seed,['aurel','brakk']);run.route=generateRoute(run);const node=run.route[0][0];
 const battle=new Battle(run,encounter(run,node.type,node.seed),node.seed,{visuals:false});
 for(let frame=0;frame<2500&&!battle.done;frame++)battle.step(.04);
 assert.ok(battle.done,`Opening encounter ${seed} settles`);
 results.push({seed,seconds:battle.time,winner:battle.winner,foes:battle.units.filter(u=>u.side===1).map(u=>u.id),contacts:battle.metrics.bladeContacts});
}
const sorted=results.map(r=>r.seconds).sort((a,b)=>a-b),median=sorted[2];
assert.ok(median>=15&&median<=25,`Opening encounter median ${median}s stays in the 15–25s pacing target`);
const report={timestep:.04,speed:1,visuals:false,median,results,limitation:'Five deterministic opening encounters, not a full balance audit. Visual hit pauses add a small amount of wall time.'};
const out=process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'playtest-artifacts/pass-one/pacing.json';
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
