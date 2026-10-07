// Imagen de la tarjeta Salidas de Baño (la original del sitio anterior). Reversion: revert-salidas-index.json
import fs from "node:fs"; import path from "node:path"; import os from "node:os"; import { spawnSync } from "node:child_process";
const STORE="wgcvpd-ib.myshopify.com", THEME="gid://shopify/OnlineStoreTheme/191904514347"; const TMP=fs.mkdtempSync(path.join(os.tmpdir(),"sb-")); let n=0;
function gql(q,v,mut){const a=path.join(TMP,`q${++n}.graphql`),b=path.join(TMP,`v${n}.json`);fs.writeFileSync(a,q);fs.writeFileSync(b,JSON.stringify(v||{}));const args=["store","execute","--store",STORE,"--query-file",a,"--variable-file",b,"--json","--no-color"];if(mut)args.push("--allow-mutations");const r=spawnSync("shopify.cmd",args,{encoding:"utf8",shell:true,maxBuffer:256*1024*1024});const o=(r.stdout||"").replace(/\u001b\[[0-9;]*[A-Za-z]/g,"");return JSON.parse(o.slice(o.indexOf("{")));}
const cur=gql(`query($id:ID!){theme(id:$id){role files(first:1,filenames:["templates/index.json"]){nodes{body{...on OnlineStoreThemeFileBodyText{content}}}}}}`,{id:THEME}).theme;
if(cur.role!=="MAIN")throw new Error("no MAIN"); const raw=cur.files.nodes[0].body.content; fs.writeFileSync("revert-salidas-index.json",raw,"utf8");
const m=raw.match(/^(\s*\/\*[\s\S]*?\*\/\s*)/); const head=m?m[1]:""; const j=JSON.parse(raw.slice(head.length));
j.sections["featured-categories"].blocks["salidas-de-bano"].settings.image="shopify://shop_images/card-salidas-de-bano.png";
const r=gql(`mutation($id:ID!,$files:[OnlineStoreThemeFilesUpsertFileInput!]!){themeFilesUpsert(themeId:$id,files:$files){upsertedThemeFiles{filename}userErrors{field message code}}}`,{id:THEME,files:[{filename:"templates/index.json",body:{type:"TEXT",value:head+JSON.stringify(j,null,2)+"\n"}}]},true);
console.log(JSON.stringify(r.themeFilesUpsert));
