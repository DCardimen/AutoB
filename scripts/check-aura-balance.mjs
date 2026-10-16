import fs from 'node:fs';
import {makeRun,encounter,Battle,creature} from '../game.js';
const samples=Number(process.env.BALANCE_SAMPLES||12),report={samples,scenarios:[],timeouts:0};
function fight(run,foes,seed){const b=new Battle(JSON.parse(JSON.stringify(run)),structuredClone(foes),seed,{visuals:false});for(let i=0;i<1351&&!b.done;i++)b.step(1/15);if(!b.done)report.timeouts++;return {won:b.winner===0,time:b.time};}
for(const [depth,level]of [[1,3],[4,5]])for(const team of [['aurel','brakk'],['aurel','syl'],['brakk','nyra']]){
 const row={team,depth,level,normalWins:0,eliteBaselineWins:0,eliteStoneWins:0,carrierFights:0,carrierWins:0,baselineCarrierWins:0};
 for(let i=0;i<samples;i++){const seed=7103+i*991,run=makeRun(seed,team);run.depth=depth;if(depth>=3){const third=creature(team[0]==='brakk'?'aurel':'rowan',level);third.balanceVersion=17;third.equipmentVersion=2;third.equipment=[];third.seat=2;run.team.push(third);run.teamCapacity=3;}for(const c of run.team)c.level=level;
 const normal=encounter(run,'battle',seed),elite=encounter(run,'elite',seed),bare=elite.map(c=>({...c,relics:[]})),carrier=elite.some(c=>c.relics?.length);
 row.normalWins+=fight(run,normal,seed).won;const baseline=fight(run,bare,seed).won,stones=fight(run,elite,seed).won;row.eliteBaselineWins+=baseline;row.eliteStoneWins+=stones;if(carrier){row.carrierFights++;row.carrierWins+=stones;row.baselineCarrierWins+=baseline;}
 }
 report.scenarios.push(row);console.log(JSON.stringify(row));
}
fs.mkdirSync('docs/evidence/aura-stones',{recursive:true});fs.writeFileSync('docs/evidence/aura-stones/balance.json',JSON.stringify(report,null,2));console.log('timeouts '+report.timeouts);
