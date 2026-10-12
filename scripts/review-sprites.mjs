import {chromium} from 'playwright';
const prefix=process.env.ART_PREFIX||'sprites-v2',browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1600,height:1200}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:3000');await page.waitForFunction(()=>window.starfall);
 for(const [name,ids,state,forms]of [['heroes',['aurel','brakk','syl','nyra','rowan'],'idle',false],['bodies',['emberhound','cogwalker','runespider','moonjelly','mireclaw','ironscolopendra','tarka','brom','nix'],'idle',false],['forms',['aurel','nyra','emberhound','cogwalker','moonjelly'],'idle',true],['motions',['aurel','brakk','syl','nyra','rowan'],'run',false]]){
  const result=await page.evaluate(async({ids,state,forms})=>{
   const {nativePosePixels}=await import('./native-poses.js'),{pixelSpec,lineageLimit}=await import('./native-content.js');let canvas=document.querySelector('#review-sheet');if(!canvas){canvas=document.createElement('canvas');canvas.id='review-sheet';document.body.replaceChildren(canvas);document.body.style.margin='0';}
   canvas.width=1536;canvas.height=ids.length*224;const ctx=canvas.getContext('2d');ctx.fillStyle='#152328';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;const small=document.createElement('canvas');small.width=small.height=64;const sc=small.getContext('2d'),issues=[];
   ids.forEach((id,i)=>{const spec=pixelSpec(id),evolution=forms?lineageLimit({id}):0;ctx.fillStyle='#e6d6ad';ctx.font='16px monospace';ctx.fillText(spec.name+(evolution?' · grand form':''),8,i*224+22);for(let d=0;d<8;d++){const pixels=nativePosePixels(spec,{id,evolution,evolutionPath:'wild'},state,.25,d);if(pixels.clipped)issues.push({id,d,clipped:pixels.clipped});sc.putImageData(new ImageData(pixels,64,64),0,0);ctx.drawImage(small,d*192,i*224+30,192,192);ctx.fillStyle='#9bab9b';ctx.font='12px monospace';ctx.fillText(['E','SE','S','SW','W','NW','N','NE'][d],d*192+6,i*224+49);}});return issues;
  },{ids,state,forms});await page.locator('#review-sheet').screenshot({path:`playtest-artifacts/${prefix}-${name}.png`});console.log(name,result.length?'CLIPPING '+JSON.stringify(result):'clean');
 }
 if(errors.length)throw new Error(errors.join('\n'));console.log('Saved real sprite contact sheets');
}finally{await browser.close();}
