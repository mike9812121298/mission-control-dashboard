import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { failureEvidence } from './failure_evidence.mjs';
const source=fs.readFileSync(new URL('./browser.mjs',import.meta.url),'utf8');
function fixture(raw,url='https://gt40marine.com/p/public?token=private') {
 const button={innerText:'Add to cart',disabled:false,getAttribute:()=>null,getClientRects:()=>[{}]};
 return {url:()=>url,evaluate:async(fn,brand)=>vm.runInNewContext('('+fn.toString()+')(brand)',{
  brand,localStorage:{getItem:()=>raw},document:{readyState:'complete',querySelectorAll:()=>[button]},getComputedStyle:()=>({visibility:'visible'})})};
}
const empty=await failureEvidence(fixture('[]'),'GT40');
assert.equal(empty.cart_items,0);assert.equal(empty.cart_state,'array');
assert.equal(empty.enabled_add_buttons,1);assert.equal(empty.capture_failed,false);
const populated=await failureEvidence(fixture('[{"private":"must-not-save"}]'),'GT40');
assert.equal(populated.cart_items,1);
assert.ok(!JSON.stringify(populated).includes('must-not-save'));
assert.equal((await failureEvidence(fixture(null),'GT40')).cart_state,'missing');
assert.equal((await failureEvidence(fixture('not JSON'),'GT40')).cart_state,'unreadable');
assert.equal((await failureEvidence(fixture('{}'),'NB')).cart_items,null);
assert.equal((await failureEvidence(fixture('[]','https://unknown.test/checkouts/private'),'NB')).current_host,'other');
const closed=await failureEvidence({url:()=>{throw Error('closed');},evaluate:async()=>{throw Error('closed');}},'NB');
assert.deepEqual(closed,{current_host:'unavailable',capture_failed:true});
const stalled=await failureEvidence({url:()=> 'https://checkout.gt40marine.com/checkouts/private',evaluate:()=>new Promise(()=>{})},'GT40',5);
assert.equal(stalled.capture_failed,true);
assert.ok(!JSON.stringify([empty,closed,stalled]).includes('private'));
const catchBlock=source.match(/catch\(e\)\{Object.assign\(row,[^\n]+/)[0];
const row={passed:false};
await vm.runInNewContext('(async()=>{try{throw {name:"TimeoutError"};}'+catchBlock+'})()',{
 row,stage:'add_to_cart',operation:'cart_persistence',errors:[],page:fixture('[]'),t:{brand:'GT40'},failureEvidence});
assert.equal(row.passed,false);assert.equal(row.error_type,'TimeoutError');
assert.equal(row.failed_operation,'cart_persistence');assert.equal(row.failure_evidence.cart_items,0);
assert.match(source,/stage='add_to_cart';operation='click';await add.click\(\)/);
assert.match(source,/operation='cart_persistence';\s+await page.waitForFunction/);
assert.match(source,/timeout:15000/);
assert.match(source,/if\(!passed\)process.exitCode=1/);
const failedCaptureRow={passed:false};
await vm.runInNewContext('(async()=>{try{throw {name:"TimeoutError"};}'+catchBlock+'})()',{
 row:failedCaptureRow,stage:'add_to_cart',operation:'click',errors:['pageerror'],page:{url:()=>'',evaluate:async()=>{throw Error('closed');}},t:{brand:'GT40'},failureEvidence});
assert.equal(failedCaptureRow.passed,false);assert.equal(failedCaptureRow.failure_evidence.capture_failed,true);
assert.equal(failedCaptureRow.page_error_count,1);assert.equal(failedCaptureRow.failed_operation,'click');
console.log(JSON.stringify({passed:true,scope:'actual failure hook; missing, invalid, empty and populated cart; closed/stalled page; privacy and original fail-closed gates'}));
