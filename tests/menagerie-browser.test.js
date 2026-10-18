import test from 'node:test';
import assert from 'node:assert/strict';
import {browseMenagerie} from '../menagerie-browser.js';
const species=[{id:'a',name:'Aurel',role:'Guardian',element:'light',rarity:'Common'},{id:'b',name:'Brakk',role:'Striker',element:'grove',rarity:'Common'},{id:'s',name:'Solara',role:'Support',element:'fire',rarity:'Legendary'}];
const profile={owned:['b','a'],bonds:{a:2,b:5}};
test('menagerie combines search terms, ownership and element without mutating the catalog',()=>{
 const before=JSON.stringify(species);
 assert.deepEqual(browseMenagerie(species,profile,{query:'Ember support',elements:{fire:{name:'Ember'}}}).map(s=>s.id),['s']);
 assert.deepEqual(browseMenagerie(species,profile).map(s=>s.id),['a','b','s']);
 assert.deepEqual(browseMenagerie(species,profile,{query:'  GROVE striker '}).map(s=>s.id),['b']);
 assert.deepEqual(browseMenagerie(species,profile,{filter:'owned',query:'legendary'}),[]);
 assert.deepEqual(browseMenagerie(species,profile,{filter:'fire',query:'support'}).map(s=>s.id),['s']);
 assert.deepEqual(browseMenagerie(species,profile,{query:'Aurel <script>'}),[]);
 assert.equal(JSON.stringify(species),before);
});
test('sorts reflect actual rarity and bond while hidden family names remain undiscovered',()=>{
 assert.equal(browseMenagerie(species,profile,{sort:'rarity'})[0].id,'s');
 assert.equal(browseMenagerie(species,profile,{sort:'bond'})[0].id,'b');
 assert.equal(browseMenagerie(species,profile,{query:'Solara'}).length,0);
 assert.equal(browseMenagerie(species,profile,{query:'Undiscovered'}).length,1);
 assert.equal(browseMenagerie(species,{owned:['s']},{query:'Solara'})[0].id,'s');
});
