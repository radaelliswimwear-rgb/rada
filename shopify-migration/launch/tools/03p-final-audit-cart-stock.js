// 03P FINAL DEEP AUDIT — tope de inventario por la ruta AJAX del tema (stock+1 → 422 y línea = stock)
// Uso: pegar en la consola (javascript_exec) de una pestaña ya autenticada con la contraseña de visitante del Dev Store
// radaelli-swimwear-dev.myshopify.com. Resultado en window.__W (rows: [sku, stock, status, mensaje]; cart; mismatch).
// Solo lectura sobre catálogo/inventario; solo toca el carrito del navegador (limpiar con POST /cart/clear.js al terminar).
// Respetar el límite 429 de Shopify: pausas >= 1,3 s; tras respuestas 422 repetidas Shopify frena con la página «Un momento…».

window.__W = {done:false, i:0, rows:[], retries:0};
(async()=>{
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const o=window.__W;
 const req=async(u,opt,gap)=>{for(let k=0;k<6;k++){const r=await fetch(u,opt);if(r.status!==429){const t=await r.text();await sleep(gap||4500);return {status:r.status,body:t}}o.retries++;await sleep(60000)}return {status:429,body:''}};
 const add=(id,q)=>{const fd=new FormData();fd.append('id',id);fd.append('quantity',String(q));return req('/cart/add.js',{method:'POST',body:fd,headers:{'X-Requested-With':'XMLHttpRequest'}},4500)};
 try{
  const pj = JSON.parse((await req('/products.json?limit=250',{},2000)).body).products;
  o.clear = (await req('/cart/clear.js',{method:'POST'},2000)).status;
  for(const p of pj){ for(const v of p.variants){
    const st = v.sku.startsWith('RSON') ? ({S:2,M:3,L:1}[v.title]) : 1; // inventario aprobado: RSON* S2/M3/L1, LG-* 1
    const r = await add(v.id, st+1);
    o.rows.push([v.sku, st, r.status, (r.body.match(/"message":"([^"]*)"/)||[])[1]||null]); o.i++;
  }}
  const cr = await req('/cart.js',{cache:'no-store'},2000); const c = JSON.parse(cr.body);
  o.cart = {lines:c.items.length, units:c.item_count};
  o.mismatch = c.items.filter(i=>{const st=i.sku.startsWith('RSON')?({S:2,M:3,L:1}[i.variant_title]):1;return i.quantity!==st}).map(i=>i.sku);
 }catch(e){o.err=String(e)}
 o.done=true;
})();
