export const LESSER_RELICS=[
 {id:'worn-heartstone',name:'Worn Heartstone',hook:'flat',effect:{hp:1.04},desc:'A small blessing: +2% maximum health for every ally.',icon:'◇'},
 {id:'chipped-fang',name:'Chipped Fang',hook:'flat',effect:{atk:1.04},desc:'A small blessing: +2% attack for every ally.',icon:'⌁'},
 {id:'faded-feather',name:'Faded Feather',hook:'flat',effect:{speed:1.04},desc:'A small blessing: +2% movement speed for every ally.',icon:'〰'},
 {id:'cracked-prism',name:'Cracked Prism',hook:'flat',effect:{shield:12},desc:'A small blessing: each ally starts battle with 6 shield.',icon:'◈'},
 {id:'tarnished-hourglass',name:'Tarnished Hourglass',hook:'flat',effect:{cd:.96},desc:'A small blessing: skill cooldowns are 2% shorter.',icon:'⌛'},
].map(r=>({...r,openingTier:'lesser',color:'#b9b298',cost:35,category:'stat'}));
export const OPENING_RELIC_POOL=['fangs','clock','seed','prism','banner','feather','coin','venom-clasp','ember-script','battle-compass','merchant-seal','prism-nest'];
export const OPENING_RECOVERY_WINS=3;
// An actual restart abandons a committed expedition, including before battle.
// Opening the team picker, cancelling it, or reloading does not count as reset.
export function recordRunReset(profile,previous){if((previous?.openingRelic||previous?.expeditionStarted)&&!previous.complete)profile.lesserOpeningRelics=(previous.wins||0)<OPENING_RECOVERY_WINS;}
export function prepareOpeningRelics(run,profile){
 if(run.openingRelic)return run.openingRelic;
 const lesser=!!profile.lesserOpeningRelics,pool=lesser?LESSER_RELICS.map(r=>r.id):OPENING_RELIC_POOL;
 let state=(Number(run.seed)^0x7a42c91d)>>>0;
 const choices=[],remaining=pool.filter(id=>!run.relics.includes(id));
 while(choices.length<2&&remaining.length){state=(Math.imul(state,1664525)+1013904223)>>>0;choices.push(remaining.splice(state%remaining.length,1)[0]);}
 run.openingRelic={choices,lesser,decision:null};return run.openingRelic;
}
export function chooseFirstRelic(run,id){
 const offer=run.openingRelic;
 if(!offer||offer.decision!==null||!offer.choices.includes(id)||run.relics.includes(id))return false;
 run.relics.push(id);offer.decision=id;return true;
}
export function skipFirstRelic(run){if(!run.openingRelic||run.openingRelic.decision!==null)return false;run.openingRelic.decision='skipped';return true;}
export function recordOpeningBattle(profile,run,won){
 if(run.wins>=OPENING_RECOVERY_WINS)profile.lesserOpeningRelics=false;
 else if(!won&&run.planet===0)profile.lesserOpeningRelics=true;
}
