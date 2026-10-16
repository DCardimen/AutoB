// Follow the actual route graph; crossing lines do not imply a connection.
export function reachableRoute(route,selectedId){
 const selected=route.flat().find(n=>n.id===selectedId),reachable=new Set();
 if(!selected)return reachable;
 reachable.add(selected.id);
 for(let depth=selected.depth;depth<route.length-1;depth++)for(const from of route[depth]){
  if(!reachable.has(from.id))continue;
  for(const to of route[depth+1])if(from.children?from.children.includes(to.id):to.type==='boss'||Math.abs(from.lane-to.lane)<=1)reachable.add(to.id);
 }
 return reachable;
}

export function stagePreviewHTML({node,info,label,art,icon,bossName,eliteHTML=''}){
 const combat=['battle','elite','capture','boss'].includes(node.type),boss=node.type==='boss';
 const copy={
  shop:['Wayfarer’s Outpost','A sheltered stop to prepare for the road ahead.','Trade & recruit','Browse equipment, relics, companions and capture tools. Inspect stock and prices before spending gold.','Equipment · Companions · Supplies'],
  rest:['Moonlit Clearing','Your companions have time for one restorative choice.','Rest & prepare','Recover an expedition life, train the active party, or replenish capture tools.','Recovery · EXP · Capture tools'],
  event:['The Whispering Signal','A strange encounter waits beyond the familiar trail.','A choice awaits','Read the event and its outcomes before choosing how to respond. Your decision may change the expedition.','Choices · Unexpected outcomes'],
 }[node.type];
 const title=copy?.[0]||(boss?bossName:info.arch.name),description=copy?.[1]||(boss?info.boss.desc:info.arch.desc),heading=copy?.[2]||'Your counterplan',advice=copy?.[3]||(boss?info.boss.counter:info.arch.counter);
 const rewards=copy?.[4]||(boss?'World progression · Gold · EXP':node.type==='elite'?'Stronger loot · Gold · EXP':node.type==='capture'?'Capture opportunities · Gold · EXP':'Gold · EXP · Possible loot');
  return `<aside class="stage-preview-popover" id="stage-preview" role="dialog" aria-modal="false" aria-labelledby="stage-preview-title" data-stage-preview="${node.id}"><header style="--preview-art:url('${art}')"><div class="stage-preview-emblem">${icon}</div><span class="section-kicker">PATH LOCKED · ENCOUNTER ${node.depth+1}</span><button type="button" data-stage-preview-close aria-label="Dismiss stage preview">×</button><small>${label}</small><h2 id="stage-preview-title">${title}</h2></header><div class="stage-preview-body"><p>${description}</p>${combat?`<div class="stage-preview-weather"><span>CONDITIONS</span><strong>${info.weather.name}</strong><p>${info.weather.desc}</p></div>`:''}${eliteHTML}<div class="stage-preview-plan"><span>${heading}</span><p>${advice}</p></div></div><footer><small><b>WHAT TO EXPECT</b>${rewards}</small><button type="button" data-field-enter="${node.id}">Enter stage <span aria-hidden="true">→</span></button></footer></aside>`;
}
