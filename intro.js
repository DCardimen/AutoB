// Session-only opening; never changes the expedition or permanent collection.
export function showLogoIntro({reducedMotion=false}={}){
 const intro=document.querySelector('#logo-intro');if(!intro)return;
 let seen=false;try{seen=sessionStorage.getItem('fang-feather-intro')==='seen';sessionStorage.setItem('fang-feather-intro','seen');}catch{}
 if(seen){intro.remove();return;}
 intro.dataset.motion=reducedMotion?'gentle':'full';
 const previous=document.activeElement,blocked=[...document.body.children].filter(el=>el!==intro&&!['SCRIPT','STYLE'].includes(el.tagName)).map(el=>({el,inert:el.inert}));
 for(const {el}of blocked)el.inert=true;
 let finished=false,timer;
 const finish=()=>{if(finished)return;finished=true;clearTimeout(timer);document.removeEventListener('keydown',key,true);intro.remove();for(const {el,inert}of blocked)el.inert=inert;const target=previous&&previous!==document.body&&previous.isConnected?previous:document.querySelector('.team-select button:not(:disabled),#new-run');target?.focus({preventScroll:true});};
 const key=e=>{e.stopImmediatePropagation();if(e.key==='Tab'){e.preventDefault();intro.querySelector('button').focus({preventScroll:true});}else if(['Escape','Enter',' '].includes(e.key)){e.preventDefault();finish();}};
 intro.querySelector('button').addEventListener('click',finish);document.addEventListener('keydown',key,true);
 intro.addEventListener('animationend',e=>{if(e.target===intro&&e.animationName==='logo-introduction')finish();});
 timer=setTimeout(finish,reducedMotion?750:2200);intro.querySelector('button').focus({preventScroll:true});
}
