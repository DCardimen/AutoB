import {makeRun,creature,generateRoute,encounter} from '../game.js';
import {makeLoot} from '../expedition-rules.js';
export async function journeyFixture(browser,{base='http://127.0.0.1:3000',offline=false,reduced=false,width=1672,height=941,recordVideo}={}){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<901,reducedMotion:reduced?'reduce':'no-preference',...(recordVideo?{recordVideo}:{} )});
 const page=await context.newPage();page.setDefaultTimeout(30000);
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const run=makeRun(83,['aurel','brakk']);run.teamCapacity=3;run.team.push({...creature('voltwing',1),seat:2,balanceVersion:15,equipment:[],relics:[]});run.route=generateRoute(run);run.relics=['fangs','prism','venom-clasp','clock'];
 run.gearInventory.push({uid:'journey-venom',id:'venom-sabre'});
 const node=run.route[0][0];node.type='elite';run.encounterType='elite';
 let foes;for(let seed=1;seed<1000;seed++){node.seed=seed;foes=encounter(run,'elite',seed).slice(0,2);const loot=makeLoot(run,'elite',foes,seed);if(loot.drops.length===3&&loot.drops.some(d=>d.kind==='gear'))break;}
 const saved={version:7,run:JSON.parse(JSON.stringify(run)),node,foes,phase:'prep',profile:{owned:['aurel','brakk','voltwing'],tutorial:true,reducedMotion:reduced}};
 await page.addInitScript(saved=>{if(!localStorage.getItem('starfall-menagerie-v1'))localStorage.setItem('starfall-menagerie-v1',JSON.stringify(saved));sessionStorage.setItem('fang-feather-intro','seen');},saved);
 if(offline)await page.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());
 await page.goto(base+(offline?'/Starfall-Menagerie.html':''));await page.waitForFunction(()=>window.starfall);await page.locator('.arena-field-tools').waitFor();
 await page.evaluate(()=>document.fonts.ready);return {page,context,errors,requests};
}
export async function winJourney(page){
 await page.evaluate(()=>{const b=starfall.state.battle;for(const u of b.living(1))b.damageUnit(u,1e6,b.living(0)[0],null,1,'status');b.step(.04);});await page.locator('.reward-screen').waitFor();
}
