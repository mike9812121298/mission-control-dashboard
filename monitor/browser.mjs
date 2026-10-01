// Public synthetic journeys only. No buyer data, orders, payment, store or ad secrets.
import { chromium } from 'playwright';
import fs from 'node:fs';
const gt='https://gt40marine.com',nb='https://noodlebomb.co';
const targets=[
 {brand:'GT40',site:gt,path:'/p/carbon-fiber-seadoo-325-300-260-230-215-185-cold-air-intake-filter-2002-2025',width:390,saved:true},
 {brand:'GT40',site:gt,path:'/p/sea-doo-shorty-power-air-intake-filter-sc-230-300-hp-blue-2002-2023',width:390,saved:true},
 {brand:'GT40',site:gt,path:'/p/sea-doo-open-loop-cooling-kit',width:390,saved:true},
 {brand:'GT40',site:gt,path:'/p/pcm-gt40-5-8-ecm',width:390,saved:true},
 {brand:'GT40',site:gt,path:'/p/pcm-gt40-5-8-ecm',width:1440,saved:false},
 {brand:'NB',site:nb,path:'/original-ramen-sauce',width:390,saved:false},
 {brand:'NB',site:nb,path:'/original-ramen-sauce',width:1440,saved:false},
];
const browser=await chromium.launch({headless:true});const rows=[];
try {
 for(const t of targets){
  const context=await browser.newContext({viewport:{width:t.width,height:900}});const page=await context.newPage();
  let stage='product';const errors=[];page.on('pageerror',()=>errors.push('pageerror'));
  const row={brand:t.brand,target:t.site+t.path,width:t.width,saved_vehicle:t.saved,passed:false};
  try {
   await page.route(/(google-analytics\.com|googletagmanager\.com|connect\.facebook\.net|facebook\.com\/tr|analytics\.tiktok\.com)/,r=>r.abort());
   await context.addInitScript(({brand,saved})=>{
    if(location.pathname==='/cart' || !['gt40marine.com','noodlebomb.co'].includes(location.hostname))return;
    if(brand==='GT40'){localStorage.setItem('gt40v5_cart','[]');localStorage.setItem('gt40v5_vehicle',JSON.stringify(saved?{make:'Sea-Doo',model:'GTR 230 / GTX 230 / Wake Pro 230',year:2023}:null));localStorage.removeItem('gt40_selected_vehicle');}
    else localStorage.setItem('nb_cart_v2','[]');
   },{brand:t.brand,saved:t.saved});
   await page.goto(t.site+t.path,{waitUntil:'domcontentloaded',timeout:45000});
   const add=page.getByRole('button',{name:/^Add to cart(?:\s|$)/i}).first();await add.waitFor({timeout:45000});
   if(!await add.isEnabled())throw Error('Unavailable');
   if(t.saved && !await page.evaluate(()=>JSON.parse(localStorage.getItem('gt40v5_vehicle'))?.year===2023))throw Error('Saved vehicle absent');
   const title=await page.locator('h1').first().innerText();
   stage='add_to_cart';await add.click();
   await page.waitForFunction(brand=>JSON.parse(localStorage.getItem(brand==='GT40'?'gt40v5_cart':'nb_cart_v2')||'[]').length>0,t.brand,{timeout:15000});
   stage='cart';await page.goto(t.site+'/cart',{waitUntil:'domcontentloaded'});
   // Shipping reminders can extend the accessible name; ignore hidden responsive duplicates.
   // Exact checkout-host and Payment UI verification below still gate success.
   const checkout=page.getByRole(t.brand==='GT40'?'button':'link',{name:/^Checkout(?:\s|$)/i}).filter({visible:true}).first();
   await checkout.waitFor({timeout:30000});if(!await checkout.isEnabled())throw Error('Disabled checkout');
   stage='hosted_payment';await checkout.click();
   const allowed=t.brand==='GT40'?['checkout.gt40marine.com','inmmrt-rk.myshopify.com']:['nu2vqa-ma.myshopify.com'];
   await page.waitForURL(url=>allowed.includes(url.hostname),{timeout:45000});
   await page.getByRole('heading',{name:'Payment',exact:true}).waitFor({timeout:45000});
   const toggle=page.getByRole('button',{name:/^Order summary/});if(await toggle.count() && await toggle.first().getAttribute('aria-expanded')!=='true')await toggle.first().click();
   const body=await page.locator('body').innerText();const words=title.split(/\s+/).filter(w=>w.length>3).slice(0,2);
   if(!words.some(w=>body.toLowerCase().includes(w.toLowerCase())))throw Error('Wrong checkout product');
   if(errors.length)throw Error('Page script errors');
   Object.assign(row,{passed:true,payment_ui:true,checkout_host:new URL(page.url()).hostname});
  }catch(e){Object.assign(row,{failed_stage:stage,error_type:e.name});}
  finally{await context.close();}
  rows.push(row);console.log(JSON.stringify(row));
 }
}finally{await browser.close();}
const passed=rows.length===targets.length&&rows.every(r=>r.passed);
const report={checked_at:new Date().toISOString(),passed,rows,payment_submitted:false,buyer_data_entered:false,tracking_verified:false};
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n## Public browser purchase journeys\n\n'+rows.map(r=>`- ${r.passed?'PASS':'FAIL'} ${r.brand} ${r.width}px ${r.target} ${r.failed_stage||'to Payment UI'}`).join('\n')+'\n\nNo buyer data or paid order. Ad attribution is not tested.\n');
console.log(JSON.stringify({passed,journeys:rows.length,payment_submitted:false}));
if(!passed)process.exitCode=1;
