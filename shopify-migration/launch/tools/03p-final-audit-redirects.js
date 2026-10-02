// 03P FINAL DEEP AUDIT — 51 redirecciones (42 al mismo origen: 200 y ruta final = destino; 9 a /account*: redirección disparada)
// Uso: pegar en la consola (javascript_exec) de una pestaña ya autenticada con la contraseña de visitante del Dev Store
// radaelli-swimwear-dev.myshopify.com. Resultado en window.__R (rows, pass, fail). La lista sale de Admin GraphQL urlRedirects (path → target).
// Solo lectura sobre catálogo/inventario; solo toca el carrito del navegador (limpiar con POST /cart/clear.js al terminar).
// Respetar el límite 429 de Shopify: pausas >= 1,3 s; tras respuestas 422 repetidas Shopify frena con la página «Un momento…».

window.__R = {done:false, rows:[], retries:0};
(async()=>{
 const sleep=ms=>new Promise(r=>setTimeout(r,ms)); const o=window.__R;
 const pairs = [/* [from, to] — pegar aquí las 51 filas de urlRedirects: 4 colecciones, 29 /producto/<handle>, páginas, 9 /cuenta/* */];
 o.total = pairs.length;
 for(const [from,to] of pairs){
  let rec={from,to};
  try{
   for(let k=0;k<4;k++){
    let r;
    if(to.startsWith('/account')){ r = await fetch(from,{redirect:'manual'}); rec.status=r.status; rec.type=r.type; rec.ok = (r.type==='opaqueredirect'); }
    else { r = await fetch(from,{redirect:'follow'}); rec.status=r.status; rec.final=new URL(r.url).pathname; rec.redirected=r.redirected; rec.ok = r.status===200 && rec.final===to && r.redirected; }
    if(r.status===429){o.retries++; await sleep(30000); continue;}
    break;
   }
  }catch(e){rec.err=String(e).slice(0,80)}
  o.rows.push(rec); await sleep(1800);
 }
 o.pass = o.rows.filter(r=>r.ok).length; o.fail = o.rows.filter(r=>!r.ok);
 o.done=true;
})();
