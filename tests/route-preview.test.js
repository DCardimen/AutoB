import test from 'node:test';
import assert from 'node:assert/strict';
import {reachableRoute,stagePreviewHTML} from '../route-preview.js';

test('future highlighting follows explicit children, including branching and rejoining',()=>{
 const route=[[{id:'a',depth:0,children:['b']},{id:'other',depth:0,children:['c']}],[{id:'b',depth:1,children:['d','e']},{id:'c',depth:1,children:['e']}],[{id:'d',depth:2,children:['boss']},{id:'e',depth:2,children:['boss']}],[{id:'boss',depth:3,type:'boss'}]];
 const before=JSON.stringify(route);assert.deepEqual([...reachableRoute(route,'a')],['a','b','d','e','boss']);assert.deepEqual([...reachableRoute(route,'c')],['c','e','boss']);assert.equal(JSON.stringify(route),before);assert.equal(reachableRoute(route,'missing').size,0);
});
test('legacy routes retain lane adjacency and boss connections',()=>{
 const route=[[{id:'a',depth:0,lane:0}],[{id:'b',depth:1,lane:1},{id:'c',depth:1,lane:3}],[{id:'boss',depth:2,lane:4,type:'boss'}]];
 assert.deepEqual([...reachableRoute(route,'a')],['a','b','boss']);
});
test('combat previews use actual scouting conditions, counterplans and stage identity',()=>{
 const args={node:{id:'elite-1',depth:2,type:'elite'},label:'Elite',art:'art.png',icon:'icon',bossName:'Guardian',eliteHTML:'Tier III mutation',info:{arch:{name:'Frost hunt',desc:'Frozen foes'},weather:{name:'Snow',desc:'Slower movement'},boss:{desc:'Boss threat',counter:'Boss counter'}}};args.info.arch.counter='Bring a cleanse';
 const html=stagePreviewHTML(args);for(const text of ['Frost hunt','Frozen foes','Snow','Slower movement','Bring a cleanse','Tier III mutation','ENCOUNTER 3','data-field-enter="elite-1"'])assert.ok(html.includes(text),text);
 const boss=stagePreviewHTML({...args,node:{...args.node,type:'boss'}});assert.match(boss,/Guardian/);assert.match(boss,/Boss counter/);
});
test('noncombat previews explain choices without inventing enemy conditions or fixed loot',()=>{
 for(const type of ['shop','rest','event']){
  const html=stagePreviewHTML({node:{id:type,depth:0,type},info:null,label:type,art:'art',icon:''});assert.doesNotMatch(html,/CONDITIONS|counterplan|\d+ gold/);assert.match(html,/data-field-enter/);
 }
});
