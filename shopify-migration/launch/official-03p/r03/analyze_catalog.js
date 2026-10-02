const j=require("./catalog_raw.json");
const p=j.products;
console.log("hasNext",p.pageInfo.hasNextPage,"products",p.nodes.length);
const tiers={};let nv=0,anyNext=false;const types={};const status={};
for(const n of p.nodes){status[n.status]=(status[n.status]||0)+1;types[n.productType]=(types[n.productType]||0)+1;
 if(n.variants.pageInfo.hasNextPage)anyNext=true;
 for(const v of n.variants.nodes){nv++;const k=v.price+"|"+v.compareAtPrice;tiers[k]=tiers[k]||{variants:0,units:0,neg:0,prods:new Set(),zero:0};const t=tiers[k];t.variants++;t.units+=v.inventoryQuantity;if(v.inventoryQuantity<0)t.neg++;if(v.inventoryQuantity===0)t.zero++;t.prods.add(n.handle);}}
console.log("variants",nv,"anyVarNext",anyNext,status,types);
for(const[k,t]of Object.entries(tiers))console.log(k,"variants",t.variants,"units",t.units,"zeroStock",t.zero,"neg",t.neg,"products",t.prods.size);
const sk=new Set();let dup=0;for(const n of p.nodes)for(const v of n.variants.nodes){if(sk.has(v.sku))dup++;sk.add(v.sku)}console.log("dupSKU",dup);
let tv=0,tu=0,w=0;for(const[k,t]of Object.entries(tiers)){tv+=t.variants;tu+=t.units;w+=parseFloat(k.split("|")[0])*t.units}console.log("total var",tv,"units",tu,"weighted",w/tu);
let sv=0;for(const[k,t]of Object.entries(tiers)){sv+=parseFloat(k.split("|")[0])*t.variants}console.log("simple variant avg",sv/tv);
const ratio=Object.keys(tiers).map(k=>{const[a,b]=k.split("|").map(Number);return [k,a/b]});console.log(ratio);
for(const n of p.nodes){const prices=[...new Set(n.variants.nodes.map(v=>v.price))];console.log(n.handle,"|",n.productType,"|",n.status,"|",prices.join(","),"|",n.variants.nodes.length,"|",n.variants.nodes.reduce((a,v)=>a+v.inventoryQuantity,0))}
