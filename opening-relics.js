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
export function openingRelicFit(id,team,species={}){
 const members=team.map(c=>species[c.id]||c),names=group=>group.map(c=>c.name||c.id).join(', ');
 if(id==='seed'){const grove=members.filter(c=>c.element==='grove'),support=members.some(c=>c.role==='Support');return {eligible:grove.length>0&&support,kind:'sustain',label:grove.length?'Grove health + stronger healing':'No Grove companion yet',detail:grove.length?`Health bonus: ${names(grove)}. Healing needs a healer.`:'The Grove health bonus will be inactive until a Grove companion joins.'};}
 if(id==='banner'){const guards=members.filter(c=>c.role==='Guardian');return {eligible:guards.length>0,kind:'defense',label:guards.length?`Protects ${names(guards)}`:'Needs a Guardian',detail:guards.length?'More health and an opening taunt for your frontline.':'No current companion receives this Guardian-only bonus.'};}
 if(id==='fangs'){const strikers=members.filter(c=>c.role==='Striker');return {eligible:strikers.length>0,kind:'offense',label:'Stronger basic attacks',detail:strikers.length?`The whole party hits harder. ${names(strikers)} also gain lifesteal.`:'The basic-attack bonus works now; lifesteal needs a Striker.'};}
 const notes={clock:['spells','Faster spells','Every companion gets shorter skill cooldowns.'],prism:['defense','Opening protection','Every companion starts each battle with a shield.'],feather:['mobility','Whole-party movement','Every companion moves faster and reacts to incoming attacks sooner.'],coin:['economy','More gold after battles','Funds later purchases; it does not increase combat stats.'],'battle-compass':['economy','Extra ordinary-battle gold','Pays after ordinary battles; no immediate combat-stat bonus.'],'merchant-seal':['economy','Cheaper outposts','Save gold when you next shop; no immediate combat-stat bonus.'],'prism-nest':['capture','More capture attempts','Each victory cache supplies a Scout Prism. You still choose a target before battle.'],'venom-clasp':['offense','Poison on connected hits','All companions can apply poison when their attacks or spells connect.'],'ember-script':['offense','Burn on connected hits','All companions can apply burn when their hits connect.']};
 const [kind,label,detail]=notes[id]||['defense','Whole-party blessing','Applies to every deployed companion.'];return {eligible:true,kind,label,detail};
}
export function prepareOpeningRelics(run,profile,species={}){
 if(run.openingRelic)return run.openingRelic;
 const lesser=!!profile.lesserOpeningRelics,pool=lesser?LESSER_RELICS.map(r=>r.id):OPENING_RELIC_POOL;
 let state=(Number(run.seed)^0x7a42c91d)>>>0;
 const choices=[],remaining=pool.filter(id=>!run.relics.includes(id)&&openingRelicFit(id,run.team||[],species).eligible);
 const take=from=>{state=(state+0x6d2b79f5)>>>0;let mixed=Math.imul(state^(state>>>15),1|state);mixed^=mixed+Math.imul(mixed^(mixed>>>7),61|mixed);const id=from[((mixed^(mixed>>>14))>>>0)%from.length];choices.push(id);remaining.splice(remaining.indexOf(id),1);};
 // One immediate combat benefit, then a different direction. Do not reroll
 // saved offers or consume the route generator's random stream.
 const combat=remaining.filter(id=>!['economy','capture'].includes(openingRelicFit(id,run.team||[],species).kind));
 if(combat.length)take(combat);
 while(choices.length<2&&remaining.length){const different=remaining.filter(id=>openingRelicFit(id,run.team||[],species).kind!==openingRelicFit(choices[0],run.team||[],species).kind);take(different.length?different:remaining);}
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
