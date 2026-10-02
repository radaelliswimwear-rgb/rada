// 03P FINAL DEEP AUDIT — formas de petición de alta al carrito sobre una variante de stock 1 (LG-ESP-000007-S)
// Uso: pegar en la consola (javascript_exec) de una pestaña ya autenticada con la contraseña de visitante del Dev Store
// radaelli-swimwear-dev.myshopify.com. Resultado en window.__T.steps. A: FormData+XHR (ruta del tema) → 422; B: JSON sin Accept → 200 (línea 2); C: POST nativo /cart/add → 200 (línea 2); D: 1+1 → 422.
// Solo lectura sobre catálogo/inventario; solo toca el carrito del navegador (limpiar con POST /cart/clear.js al terminar).
// Respetar el límite 429 de Shopify: pausas >= 1,3 s; tras respuestas 422 repetidas Shopify frena con la página «Un momento…».

window.__T = {done:false, steps:[]};
(async()=>{
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const o=window.__T; const ID=67603648348479; // variante LG-ESP-000007-S del laboratorio
 const step=async(name,fn)=>{let r;for(let k=0;k<4;k++){r=await fn();if(r.status!==429)break;o.steps.push([name,'429 backoff']);await sleep(45000)}await sleep(2500);o.steps.push([name,r.status,(r.text||'').slice(0,160)])};
 const cartQ=async()=>{const r=await fetch('/cart.js',{cache:'no-store'});await sleep(2500);if(r.status!==200)return 'cart.js '+r.status;const c=await r.json();return JSON.stringify(c.items.map(i=>[i.sku,i.quantity]))};
 const clear=()=>step('clear',async()=>{const r=await fetch('/cart/clear.js',{method:'POST'});return {status:r.status}});
 try{
  await clear();
  await step('A FormData id+qty2 (ruta del tema, XHR)',async()=>{const fd=new FormData();fd.append('id',ID);fd.append('quantity','2');const r=await fetch('/cart/add.js',{method:'POST',body:fd,headers:{'X-Requested-With':'XMLHttpRequest'}});return {status:r.status,text:await r.text()}});
  o.steps.push(['A carrito',await cartQ()]);
  await clear();
  await step('B JSON {id,quantity:2} sin Accept',async()=>{const r=await fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:ID,quantity:2})});return {status:r.status,text:await r.text()}});
  o.steps.push(['B carrito',await cartQ()]);
  await clear();
  await step('C POST nativo /cart/add qty2',async()=>{const r=await fetch('/cart/add',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'id='+ID+'&quantity=2'});return {status:r.status,text:'url='+r.url}});
  o.steps.push(['C carrito',await cartQ()]);
  await clear();
 }catch(e){o.err=String(e)}
 o.done=true;
})();
