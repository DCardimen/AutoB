export const TUNING_OPTIONS = [
  {id:'spriteSize',name:'Sprite size',min:50,max:400,step:5,group:'Combat feel',description:'Scale every body, held weapon and hitbox together. Creature type sizes stay proportional.'},
  {id:'smallSize',name:'Small creature size',min:50,max:200,step:5,group:'Combat feel',description:'Extra scale for type sizes of 90% or smaller.'},
  {id:'largeSize',name:'Large creature size',min:50,max:200,step:5,group:'Combat feel',description:'Extra scale for type sizes of 120% or larger, including evolved forms.'},
  {id:'movementSpeed',name:'Movement speed',min:50,max:200,step:5,group:'Combat feel',description:'Walking, sprinting, dashes and physical dodge travel for both teams.'},
  {id:'acceleration',name:'Acceleration',min:25,max:250,step:5,group:'Combat feel',description:'How quickly a creature reaches its intended running speed.'},
  {id:'braking',name:'Braking',min:25,max:250,step:5,group:'Combat feel',description:'How quickly creatures stop or slow into a turn.'},
  {id:'turnSpeed',name:'Turning response',min:50,max:250,step:5,group:'Combat feel',description:'How quickly creatures face their target before attacking.'},
  {id:'knockback',name:'Hit knockback',min:0,max:200,step:5,group:'Combat feel',description:'Physical displacement from hits. Damage and stun strength stay at their normal values.'},
  {id:'gaitPace',name:'Running animation pace',min:50,max:200,step:5,group:'Presentation',description:'Leg cycle pace, independently of distance traveled. Tune away sliding or frantic steps.'},
  {id:'capeMotion',name:'Cape flow',min:0,max:200,step:5,group:'Presentation',description:'Wind and flutter on the physical cape; its shoulder attachments remain fixed.'},
  {id:'damageTextSize',name:'Damage number size',min:50,max:200,step:5,group:'Presentation',description:'Crisp pixel damage, healing, shield and critical-hit numbers.'},
  {id:'effectIntensity',name:'Combat effect intensity',min:0,max:200,step:5,group:'Presentation',description:'Brightness and weight of impacts, magic rings and particles. Telegraphs remain readable.'},
  {id:'cameraShake',name:'Camera shake',min:0,max:200,step:5,group:'Presentation',description:'Screen impact from heavy attacks and critical hits. Zero disables it.'},
];
export const DEFAULT_TUNING = Object.freeze(Object.fromEntries(TUNING_OPTIONS.map(o=>[o.id,100])));
export function normalizeTuning(values={}) {
  return Object.fromEntries(TUNING_OPTIONS.map(o=>{
    const n=Number(values?.[o.id]);
    return [o.id,Number.isFinite(n)?Math.max(o.min,Math.min(o.max,Math.round(n/o.step)*o.step)):100];
  }));
}
let current={...DEFAULT_TUNING};
export function setTuning(values){current=normalizeTuning(values);return {...current};}
export function getTuning(){return {...current};}
export function tuningFactor(id){return current[id]/100;}
