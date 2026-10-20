import {smooth} from './fox-motion.mjs';

const pulse=(t,start,rise,fall)=>smooth(start,start+rise,t)*(1-smooth(start+rise,start+rise+fall,t));
// Independent, occasional attention/sniff gestures. Rest and eye silhouettes
// remain authored; the actual mesh targets are registered on the source head.
export function foxExpressions(time,mode='idle'){
 if(mode==='death')return [0,0,0];
 const t=((time%8)+8)%8;
 const right=pulse(t,1.25,.09,.22)-.18*pulse(t,1.56,.08,.18)+.35*pulse(t,6.05,.12,.28);
 const left=.85*pulse(t,4.05,.09,.24)-.14*pulse(t,4.38,.08,.18)+.28*pulse(t,6.16,.12,.28);
 const nose=.85*pulse(t,2.05,.12,.18)+.65*pulse(t,2.42,.11,.18)+.35*pulse(t,5.35,.13,.22);
 return [right,left,nose];
}
