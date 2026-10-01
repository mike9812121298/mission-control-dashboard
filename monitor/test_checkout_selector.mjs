// Pure regression against the actual scheduled selector, without browser/network access.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./browser.mjs',import.meta.url),'utf8');
const statement=source.match(/^\s*const checkout=.*;$/m)?.[0];
assert.ok(statement,'Actual scheduled checkout selector must be present');
function selected(brand,elements){
 const page={getByRole(role,{name}){
  const matches=elements.filter(e=>e.role===role&&name.test(e.name));
  return {filter({visible}){assert.equal(visible,true);return {first(){return matches.find(e=>e.visible);}};}};
 }};
 return vm.runInNewContext(statement+'\ncheckout;', {page,t:{brand}});
}
const link={role:'link',name:'Checkout',visible:true};
const notice={...link,name:'Checkout Ships from November 2'};
assert.equal(selected('NB',[link]),link);
assert.equal(selected('NB',[notice]),notice);
assert.equal(selected('NB',[{...notice,visible:false},notice]),notice);
assert.equal(selected('NB',[{...notice,visible:false}]),undefined);
assert.equal(selected('NB',[{...notice,name:'Checkoutfake'}]),undefined);
assert.equal(selected('NB',[{...notice,name:'Continue shopping'}]),undefined);
const button={role:'button',name:'Checkout',visible:true};
assert.equal(selected('GT40',[link,button]),button);
assert.equal(selected('NB',[button,notice]),notice);
assert.equal(selected('NB',[{...notice,name:'Checkout\nShips from November 2'}])?.visible,true);
assert.equal(selected('NB',[{...notice,name:'CHECKOUT Ships from November 2'}])?.visible,true);
assert.match(source,/if\(!await checkout\.isEnabled\(\)\)throw Error\('Disabled checkout'\)/);
assert.match(source,/waitForURL\(url=>allowed\.includes\(url\.hostname\)/);
assert.match(source,/getByRole\('heading',\{name:'Payment',exact:true\}\)/);
console.log(JSON.stringify({passed:true,assertions:13,scope:'checkout labels, visibility, brand roles, retained destination/payment gates'}));
