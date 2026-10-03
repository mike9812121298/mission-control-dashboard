// Public, bounded, read-only failure diagnostics. Never serialize URLs, page text,
// storage contents, request bodies, checkout IDs, headers or exception messages.
export async function failureEvidence(page, brand, timeoutMs=1500) {
 const allowed=['gt40marine.com','noodlebomb.co','checkout.gt40marine.com','inmmrt-rk.myshopify.com','nu2vqa-ma.myshopify.com'];
 let current_host='unavailable';
 try { const host=new URL(page.url()).hostname;current_host=allowed.includes(host)?host:'other'; } catch {}
 let timer;
 try {
  const state=await Promise.race([
   page.evaluate(brand=>{
    let cart_items=null,cart_state='unavailable';
    try { const raw=localStorage.getItem(brand==='GT40'?'gt40v5_cart':'nb_cart_v2');
     if(raw===null)cart_state='missing';
     else {const parsed=JSON.parse(raw);cart_state=Array.isArray(parsed)?'array':'invalid';if(Array.isArray(parsed))cart_items=parsed.length;}
    } catch {cart_state='unreadable';}
    const buttons=[...document.querySelectorAll('button')].filter(b=>/^Add to cart(?:\s|$)/i.test(b.innerText||b.getAttribute('aria-label')||''));
    const visible=buttons.filter(b=>b.getClientRects().length>0&&getComputedStyle(b).visibility!=='hidden');
    return {ready_state:document.readyState,cart_state,cart_items,add_buttons:buttons.length,visible_add_buttons:visible.length,enabled_add_buttons:visible.filter(b=>!b.disabled&&b.getAttribute('aria-disabled')!=='true').length};
   },brand),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('bounded capture')),timeoutMs);})
  ]);
  return {current_host,...state,capture_failed:false};
 } catch {return {current_host,capture_failed:true};}
 finally {clearTimeout(timer);}
}
