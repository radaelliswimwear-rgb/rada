// 03P FINAL DEEP AUDIT — arnés por PDP (29 productos, 98 variantes, iframe de 390 px)
// Uso: pegar en la consola (javascript_exec) de una pestaña ya autenticada con la contraseña de visitante del Dev Store
// radaelli-swimwear-dev.myshopify.com. Resultado en window.__A.products (por producto: issues[], variants[], h1, precio, galería, acordeones, canonical, JSON-LD, og, consola/recursos).
// Solo lectura sobre catálogo/inventario; solo toca el carrito del navegador (limpiar con POST /cart/clear.js al terminar).
// Respetar el límite 429 de Shopify: pausas >= 1,3 s; tras respuestas 422 repetidas Shopify frena con la página «Un momento…».

window.__A={done:false,idx:0,total:0,products:[],start:Date.now()};
(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));const R=window.__A;
const J=async r=>{const t=await r.text();try{return JSON.parse(t)}catch{return null}};
const g=async u=>{await sl(1300);return fetch(u)};
const list=(await J(await g('/products.json?limit=250'))).products;R.total=list.length;
let holder=document.getElementById('__h');if(holder)holder.remove();holder=document.createElement('div');holder.id='__h';holder.style.cssText='position:fixed;left:0;top:0;width:390px;height:844px;z-index:99999;background:#fff;overflow:hidden';document.body.appendChild(holder);
const INJ='<script>window.__errs=[];window.__res=[];(function(){var oe=console.error;console.error=function(){try{window.__errs.push([].map.call(arguments,String).join(" ").slice(0,160))}catch(e){}oe.apply(console,arguments)};window.addEventListener("error",function(e){if(e.target&&e.target!==window&&(e.target.src||e.target.href)){window.__res.push((e.target.tagName+":"+(e.target.src||e.target.href)).slice(0,160))}else{window.__errs.push(String(e.message).slice(0,160))}},true);window.addEventListener("unhandledrejection",function(e){window.__errs.push("rej:"+String(e.reason).slice(0,140))})})();<\/script>';
for(const p of list){R.idx++;const o={h:p.handle,title:p.title,issues:[],variants:[]};
try{
const pj=await J(await g('/products/'+p.handle+'.js'));
await sl(1000);const html=await (await fetch('/products/'+p.handle)).text();
const f=document.createElement('iframe');f.style.cssText='width:390px;height:844px;border:0';holder.innerHTML='';holder.appendChild(f);
f.srcdoc=html.replace('<head>','<head><base href="'+location.origin+'/products/'+p.handle+'">'+INJ);
await sl(6500);
const d=f.contentDocument,w=f.contentWindow,de=d.documentElement;o.vw=w.innerWidth;
// layout 390
o.overflow=de.scrollWidth>391;if(o.overflow)o.issues.push('overflow390:'+de.scrollWidth);
// content
const h1=d.querySelector('h1');o.h1=(h1&&h1.innerText.trim())||'';if(!o.h1)o.issues.push('sin h1');else if(o.h1.toLowerCase()!==p.title.toLowerCase())o.issues.push('h1!=title');
const main=d.querySelector('main')||d.body;const txt=main.innerText||'';
if(/undefined|NaN|\[object|null\b|Lorem|TODO|placeholder/i.test(txt))o.issues.push('texto sospechoso:'+(txt.match(/undefined|NaN|\[object|null\b|Lorem|TODO|placeholder/i)||[''])[0]);
const pm=txt.match(/\$\s?([\d.]+)/);o.priceText=pm?pm[0]:'';if(!pm)o.issues.push('sin precio');
const cur=pj?pj.variants.find(v=>v.id===+((d.querySelector('[data-variant-id-input]')||{}).value))||pj.variants[0]:null;
if(pm&&cur&&parseInt(pm[1].replace(/\./g,''),10)!==cur.price/100)o.issues.push('precio '+pm[1]+' != '+cur.price/100);
// gallery/images
const imgs=[...d.querySelectorAll('.product-gallery img, [class*=gallery] img')];o.galleryImgs=imgs.length;if(pj&&imgs.length<1)o.issues.push('sin galeria');
imgs.forEach(i=>{i.loading='eager'});await sl(2500);
const bad=imgs.filter(i=>i.getAttribute('src')&&i.complete&&i.naturalWidth===0).length;const pend=imgs.filter(i=>!i.complete).length;o.imgsBad=bad;o.imgsPending=pend;if(bad)o.issues.push('imgs rotas:'+bad);if(pend)o.issues.push('imgs sin cargar:'+pend);
o.pjImages=pj?pj.images.length:null;
// controls
const addBtn=d.querySelector('form[action*="/cart/add"] [name=add]');o.addBtn=!!addBtn;if(!addBtn)o.issues.push('sin boton agregar');
const groups=[...d.querySelectorAll('[data-option-group]')];o.optGroups=groups.length;
// accordions
const sums=[...d.querySelectorAll('details summary')];o.acc=sums.length;let accBad=0;for(const s of sums){const dt=s.parentElement;const was=dt.open;s.click();await sl(150);if(dt.open===was)accBad++;s.click();await sl(100);}if(!sums.length)o.issues.push('sin acordeones');if(accBad)o.issues.push('acordeones sin respuesta:'+accBad);
// meta
const can=d.querySelector('link[rel=canonical]');o.canonicalOk=!!can&&can.href.endsWith('/products/'+p.handle);if(!o.canonicalOk)o.issues.push('canonical');
let ldok=0,ldbad=0;d.querySelectorAll('script[type="application/ld+json"]').forEach(s=>{try{JSON.parse(s.textContent);ldok++}catch{ldbad++}});o.ld=[ldok,ldbad];if(ldbad||!ldok)o.issues.push('json-ld');
o.og=!!d.querySelector('meta[property="og:image"]')&&!!d.querySelector('meta[property="og:title"]');if(!o.og)o.issues.push('og');
// variants
if(pj){const vidIn=()=>d.querySelector('[data-variant-id-input]');
for(const v of pj.variants){const vo={id:v.id,sku:v.sku,ok:true};
try{groups.forEach((gp,gi)=>{const val=v.options[+gp.getAttribute('data-option-position')-1];const inp=[...gp.querySelectorAll('input[data-option-input]')].find(i=>i.value===val);if(!inp)throw new Error('sin opcion '+val);if(!inp.checked){inp.click();}});
await sl(450);
const sel=+((vidIn()||{}).value);if(sel!==v.id){vo.ok=false;vo.err='variant id '+sel+' != '+v.id;}
const t2=(d.querySelector('main')||d.body).innerText;const pm2=t2.match(/\$\s?([\d.]+)/);if(pm2&&parseInt(pm2[1].replace(/\./g,''),10)!==v.price/100){vo.ok=false;vo.err=(vo.err||'')+' precio '+pm2[1]+' != '+v.price/100;}
const b=d.querySelector('form[action*="/cart/add"] [name=add]');const dis=!!(b&&(b.disabled||b.getAttribute('aria-disabled')==='true'));if(b&&dis===v.available){vo.ok=false;vo.err=(vo.err||'')+' boton '+(dis?'deshabilitado':'activo')+' pero available='+v.available;}
vo.available=v.available;}catch(e){vo.ok=false;vo.err=String(e.message||e).slice(0,80)}
o.variants.push(vo);}}
o.errs=(w.__errs||[]).slice(0,6);o.resErr=(w.__res||[]).slice(0,6);
if(o.errs.length)o.issues.push('console:'+o.errs.length);if(o.resErr.length)o.issues.push('recursos fallidos:'+o.resErr.length);
const vb=o.variants.filter(x=>!x.ok).length;if(vb)o.issues.push('variantes con fallo:'+vb);
}catch(e){o.issues.push('EXC '+String(e).slice(0,100))}
o.pass=o.issues.length===0;R.products.push(o);}
holder.remove();R.done=true;R.secs=Math.round((Date.now()-R.start)/1000);})();'started'
