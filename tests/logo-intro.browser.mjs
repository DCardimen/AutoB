import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.BASE_URL||'http://127.0.0.1:3000',report={checks:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
fs.mkdirSync('playtest-artifacts',{recursive:true});
async function fixture({offline=false,width=1440,reduced=false}={}){
 const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:reduced?'reduce':'no-preference'}),page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 if(offline)await context.route('**/*',r=>r.request().isNavigationRequest()?r.continue():r.abort());
 await page.goto(base+(offline?'/Starfall-Menagerie.html':'/index.html'));await page.waitForFunction(()=>window.starfall);return {page,context};
}
try{
 for(const offline of [false,true]){
  const {page,context}=await fixture({offline}),intro=page.locator('#logo-intro');
  await intro.waitFor({state:'visible'});assert.equal(await intro.getAttribute('role'),'dialog');
  assert.equal(await page.locator('#app').evaluate(el=>el.inert),true,'gameplay cannot be clicked through the intro');
  assert.ok(await intro.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0),'original logo loads');
  assert.equal(await intro.locator('blockquote p').textContent(),'“For every action, there is an equal and opposite reaction.”');assert.equal(await intro.locator('cite').textContent(),'— Isaac Newton');
  assert.ok(!(await intro.textContent()).includes('Unlikely companions'));
  const runBefore=await page.evaluate(()=>JSON.stringify(starfall.state.run));
  await page.screenshot({path:`playtest-artifacts/logo-intro-${offline?'offline':'source'}.png`});
  await intro.waitFor({state:'detached',timeout:5000});assert.equal(await page.locator('#app').evaluate(el=>el.inert),false);
  assert.equal(await page.evaluate(()=>JSON.stringify(starfall.state.run)),runBefore,'intro never advances or replaces the expedition');
  assert.ok(await page.evaluate(()=>!document.activeElement.closest('[inert]')),'focus returns to usable game controls');
  await page.reload();await page.waitForFunction(()=>window.starfall);assert.equal(await page.locator('#logo-intro').count(),0,'reload in the same session does not replay the intro');
  await page.locator('#new-run').click();assert.ok(await page.locator('.team-select').isVisible());await page.locator('[data-starter="cinderfox"]').click();
  assert.equal(await page.locator('[data-starter="cinderfox"] .starter-portrait').getAttribute('data-gesture'),'ear-flick');
  report.checks.push(`${offline?'Offline':'Source'}: original logo, automatic brief dismissal, protected game controls, restored focus, unchanged expedition, once per session, working team selection`);await context.close();
 }
 for(const width of [320,390]){
  const {page,context}=await fixture({width});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`playtest-artifacts/logo-intro-${width}.png`});await page.getByRole('button',{name:'Skip logo introduction'}).click();assert.equal(await page.locator('#logo-intro').count(),0);assert.equal(await page.locator('#app').evaluate(el=>el.inert),false);await context.close();
 }
 for(const offline of [false,true])for(const key of ['Escape','Enter','Space']){const keyboard=await fixture({offline});await keyboard.page.keyboard.press('Tab');assert.ok(await keyboard.page.getByRole('button',{name:'Skip logo introduction'}).evaluate(el=>el===document.activeElement),'Tab stays in the intro');await keyboard.page.keyboard.press(key);assert.equal(await keyboard.page.locator('#logo-intro').count(),0);assert.ok(await keyboard.page.locator('.team-select').isVisible(),`${key} skips only the intro and preserves team selection`);await keyboard.context.close();}
 const reduced=await fixture({reduced:true});if(await reduced.page.locator('#logo-intro').count()){assert.equal(await reduced.page.locator('#logo-intro img').evaluate(el=>getComputedStyle(el).animationName),'none');await reduced.page.locator('#logo-intro').waitFor({state:'detached',timeout:2500});}assert.equal(await reduced.page.locator('#app').evaluate(el=>el.inert),false);await reduced.context.close();
 report.checks.push('320/390px layouts, immediate button/Escape/Enter/Space skip without closing team selection, trapped keyboard focus, reduced motion without zoom');assert.deepEqual(report.errors,[]);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync('playtest-artifacts/logo-intro-browser.json',JSON.stringify(report,null,2));await browser.close();}
