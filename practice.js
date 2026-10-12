import {Battle,creature} from './game.js';
export const PRACTICE_SCENARIOS={moving:'Moving ranger',shielded:'Shielded guardian',clustered:'Clustered trio'};
export function practiceBattle(run,scenario='shielded',baseline=false){
 if(!run.native||!run.team?.length||!PRACTICE_SCENARIOS[scenario])return null;
 const copy=JSON.parse(JSON.stringify(run));copy.team=copy.team.filter(Boolean);copy.captureOrder=null;copy.captureReservation=null;copy.encounterType='practice';copy.contracts=[];
 if(baseline){copy.relics=[];copy.team.forEach(c=>c.relics=[]);}
 const level=Math.max(1,Math.round(copy.team.reduce((n,c)=>n+c.level,0)/copy.team.length));
 const foes=(scenario==='moving'?['rowan']:scenario==='clustered'?['brakk','aurel','moonjelly']:['aurel']).map(id=>creature(id,level));
 const battle=new Battle(copy,foes,90471);battle.terrain=[];battle.practice=true;battle.baseline=baseline;battle.scenario=scenario;
 let index=0;for(const u of battle.units.filter(u=>u.side===1)){u.x=u.px=650+index*36;u.y=u.py=400+index*18;u.nativeHome={x:u.x,y:u.y};u.hp=u.maxHp=1000;u.shield=scenario==='shielded'?400:0;u.atk=4;for(const cd of Object.values(u.cooldowns))cd.remaining=999;index++;}
 return battle;
}
export function practiceResult(battle){return {seconds:battle.time,damage:Math.round(battle.metrics.damage),healing:Math.round(battle.metrics.healing),shieldDamage:Math.round(battle.metrics.shieldDamage),whiffs:battle.metrics.whiffs,interruptions:battle.metrics.interruptedSkills,skills:battle.metrics.skills};}
