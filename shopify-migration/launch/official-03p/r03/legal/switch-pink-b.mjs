// Edicion rosa: cambia de la opcion C (#7A2E4A) a la opcion B (rosa palo #C77D93), decision de la duena en el chat 2026-10-03.
import fs from "node:fs"; import path from "node:path"; import os from "node:os"; import { spawnSync } from "node:child_process";
const STORE="wgcvpd-ib.myshopify.com", THEME="gid://shopify/OnlineStoreTheme/191904514347"; const TMP=fs.mkdtempSync(path.join(os.tmpdir(),"pk-")); let n=0;
function gql(q,v,mut){const a=path.join(TMP,`q${++n}.graphql`),b=path.join(TMP,`v${n}.json`);fs.writeFileSync(a,q);fs.writeFileSync(b,JSON.stringify(v||{}));const args=["store","execute","--store",STORE,"--query-file",a,"--variable-file",b,"--json","--no-color"];if(mut)args.push("--allow-mutations");const r=spawnSync("shopify.cmd",args,{encoding:"utf8",shell:true,maxBuffer:256*1024*1024});const o=(r.stdout||"").replace(/\u001b\[[0-9;]*[A-Za-z]/g,"");if(o.indexOf("{")<0)throw new Error(r.stderr);return JSON.parse(o.slice(o.indexOf("{")));}
const FILES=["sections/header-group.json","assets/component-card.css"];
const cur=gql(`query($id:ID!,$f:[String!]){theme(id:$id){role files(first:5,filenames:$f){nodes{filename body{...on OnlineStoreThemeFileBodyText{content}}}}}}`,{id:THEME,f:FILES}).theme;
if(cur.role!=="MAIN")throw new Error("no MAIN");
const get=Object.fromEntries(cur.files.nodes.map(x=>[x.filename,x.body.content]));
let h=get[FILES[0]],c=get[FILES[1]];
if(!h.includes('"#7A2E4A"')||!h.includes('"#F8E4EA"')||!c.includes("color: #F8E4EA; /* edicion rosa")) throw new Error("estado inesperado");
h=h.replace('"#7A2E4A"','"#C77D93"').replace('"#F8E4EA"','"#FFFFFF"');
c=c.replace("color: #F8E4EA; /* edicion rosa oct-2026 */\n  background-color: #7A2E4A;","color: #FFFFFF; /* edicion rosa oct-2026 (B) */\n  background-color: #C77D93;");
if(c.includes("#7A2E4A"))throw new Error("css no cambio");
const r=gql(`mutation($id:ID!,$files:[OnlineStoreThemeFilesUpsertFileInput!]!){themeFilesUpsert(themeId:$id,files:$files){upsertedThemeFiles{filename}userErrors{field message code}}}`,{id:THEME,files:[{filename:FILES[0],body:{type:"TEXT",value:h}},{filename:FILES[1],body:{type:"TEXT",value:c}}]},true);
console.log(JSON.stringify(r.themeFilesUpsert));
