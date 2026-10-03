// Edicion rosa (opcion C, aprobada en el chat 2026-10-03): barra y etiqueta -20% en rosa profundo; vigencia hasta 31 de octubre. Sin mencion de donacion ni de enfermedad. Revertir: node apply-pink.mjs --revert
import fs from "node:fs"; import path from "node:path"; import os from "node:os"; import { spawnSync } from "node:child_process";
const STORE="wgcvpd-ib.myshopify.com", THEME="gid://shopify/OnlineStoreTheme/191904514347"; const TMP=fs.mkdtempSync(path.join(os.tmpdir(),"pk-")); let n=0;
function gql(q,v,mut){const a=path.join(TMP,`q${++n}.graphql`),b=path.join(TMP,`v${n}.json`);fs.writeFileSync(a,q);fs.writeFileSync(b,JSON.stringify(v||{}));const args=["store","execute","--store",STORE,"--query-file",a,"--variable-file",b,"--json","--no-color"];if(mut)args.push("--allow-mutations");const r=spawnSync("shopify.cmd",args,{encoding:"utf8",shell:true,maxBuffer:256*1024*1024});const o=(r.stdout||"").replace(/\u001b\[[0-9;]*[A-Za-z]/g,"");if(o.indexOf("{")<0)throw new Error(r.stderr);return JSON.parse(o.slice(o.indexOf("{")));}
const FILES=["sections/header-group.json","assets/component-card.css"];
const REV=process.argv.includes("--revert"), DRY=process.argv.includes("--dry");
const cur=gql(`query($id:ID!,$f:[String!]){theme(id:$id){role files(first:5,filenames:$f){nodes{filename body{...on OnlineStoreThemeFileBodyText{content}}}}}}`,{id:THEME,f:FILES}).theme;
if(cur.role!=="MAIN")throw new Error("no MAIN");
const get=Object.fromEntries(cur.files.nodes.map(x=>[x.filename,x.body.content]));
const upserts=[];
if(REV){for(const f of FILES){upserts.push({filename:f,body:{type:"TEXT",value:fs.readFileSync("revert-pink-"+f.replace("/","__"),"utf8")}});}}
else{
 for(const f of FILES)fs.writeFileSync("revert-pink-"+f.replace("/","__"),get[f],"utf8");
 let h=get[FILES[0]]; const a='"text": "20% de descuento en toda la tienda"';
 if(!h.includes(a))throw new Error("header-group distinto");
 h=h.replace(a,'"text": "Edición rosa · 20% de descuento en toda la tienda hasta el 31 de octubre",\n        "background_color": "#7A2E4A",\n        "text_color": "#F8E4EA"');
 let c=get[FILES[1]]; const b="  color: var(--color-primary-contrast);\n  background-color: var(--color-brand);\n}";
 const i=c.indexOf(".price__discount {"); const j=c.indexOf("}",i);
 let blk=c.slice(i,j+1); if(!/color: var\(--color-primary-contrast\);\s*background-color: var\(--color-brand\);/.test(blk))throw new Error("css distinto");
 blk=blk.replace(/color: var\(--color-primary-contrast\);\s*background-color: var\(--color-brand\);/,"color: #F8E4EA; /* edicion rosa oct-2026 */\n  background-color: #7A2E4A;");
 c=c.slice(0,i)+blk+c.slice(j+1);
 upserts.push({filename:FILES[0],body:{type:"TEXT",value:h}},{filename:FILES[1],body:{type:"TEXT",value:c}});
}
console.log(DRY?"DRY":"APPLY",upserts.map(u=>u.filename));
if(!DRY){const r=gql(`mutation($id:ID!,$files:[OnlineStoreThemeFilesUpsertFileInput!]!){themeFilesUpsert(themeId:$id,files:$files){upsertedThemeFiles{filename}userErrors{field message code}}}`,{id:THEME,files:upserts},true);console.log(JSON.stringify(r.themeFilesUpsert));}