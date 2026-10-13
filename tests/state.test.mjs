import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,parseGear,parsePlans,createPlan,restorePlan} from '../dist/test/state/model.mjs';
test('plans exclude coordinates by default and restore saved instant and gear',()=>{
 const state={...initialState,instant:Date.parse('2026-11-01T06:30:00Z'),timezone:'America/New_York',observer:{lat:40.7,lng:-74},gear:{...initialState.gear,lens:135},intent:'moon'};
 const ordinary=createPlan(state,false,'one');assert.equal(ordinary.lat,undefined);assert.equal(ordinary.lng,undefined);
 const restored=restorePlan({...initialState,observer:{lat:35,lng:139}},ordinary);assert.deepEqual(restored.observer,{lat:35,lng:139});assert.equal(restored.instant,state.instant);assert.equal(restored.gear.lens,135);assert.equal(restored.intent,'moon');
 const precise=createPlan(state,true,'two');const positioned=restorePlan(initialState,precise);assert.deepEqual(positioned.observer,state.observer);assert.equal(positioned.timezone,state.timezone);assert.equal(positioned.source,'manual');
});
test('legacy v1 plans and gear are validated without modifying storage on read',()=>{
 const legacy={instant:'2026-10-12T03:00:00Z',timezone:'Asia/Seoul',intent:'sunset',lens:35,sensor:'ff',lat:37,lng:127};
 const plans=parsePlans([null,legacy,{...legacy,timezone:'invalid'},{...legacy,lat:100},{...legacy,instant:'no date'}]);assert.equal(plans.length,1);assert.equal(plans[0].id,'legacy-1');assert.equal(plans[0].lat,37);
 assert.equal(parsePlans('wrong').length,0);assert.equal(parseGear({sensor:'__proto__',lens:Infinity}).sensor,'ff');assert.equal(parseGear({lens:999}).lens,200);
});
