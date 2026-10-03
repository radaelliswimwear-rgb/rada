// Edicion rosa: fija colores de barra y etiqueta -20%. Uso: node set-pink.mjs <fondo> <texto>   (p. ej. #E8B4C2 #5B2A3C). Reversion total a negro: apply-pink.mjs --revert
import path from "node:path"; import fs from "node:fs"; import os from "node:os"; import { spawnSync } from "node:child_process";
const [BG, FG] = process.argv.slice(2); if (!/^#[0-9A-Fa-f]{6}$/.test(BG || "") || !/^#[0-9A-Fa-f]{6}$/.test(FG || "")) throw new Error("uso: node set-pink.mjs #FONDO #TEXTO");
const STORE="wgcvpd-ib.myshopify.com", THEME="gid://shopify/OnlineStoreTheme/191904514347"; const TMP=fs.mkdtempSync(path.join(os.tmpdir(),"pk-")); let n=0;
function gql(q,v,mut){const a=path.join(TMP,`q${++n}.graphql`),b=path.join(TMP,`v${n}.json`);fs.writeFileSync(a,q);fs.writeFileSync(b,JSON.stringify(v||{}));const args=["store","execute","--store",STORE,"--query-file",a,"--variable-file",b,"--json","--no-color"];if(mut)args.push("--allow-mutations");const r=spawnSync("shopify.cmd",args,{encoding:"utf8",shell:true,maxBuffer:256*1024*1024});const o=(r.stdout||"").replace(/\u001b\[[0-9;]*[A-Za-z]/g,"");if(o.indexOf("{")<0)throw new Error(r.stderr);return JSON.parse(o.slice(o.indexOf("{")));}
const FILES=["sections/header-group.json","assets/component-card.css"];
const cur=gql(`query($id:ID!,$f:[String!]){theme(id:$id){role files(first:5,filenames:$f){nodes{filename body{...on OnlineStoreThemeFileBodyText{content}}}}}}`,{id:THEME,f:FILES}).theme;
if(cur.role!=="MAIN")throw new Error("no MAIN");
const get=Object.fromEntries(cur.files.nodes.map(x=>[x.filename,x.body.content]));
let h=get[FILES[0]],c=get[FILES[1]];
const hm=h.match(/"background_color": "(#[0-9A-Fa-f]{6})",\s*"text_color": "(#[0-9A-Fa-f]{6})"/); if(!hm) throw new Error("header-group sin colores rosa");
h=h.replace(hm[0],`"background_color": "${BG}",\n        "text_color": "${FG}"`);
const cm=c.match(/color: (#[0-9A-Fa-f]{6}); \/\* edicion rosa[^*]*\*\/\s*background-color: (#[0-9A-Fa-f]{6});/); if(!cm) throw new Error("css sin marca rosa");
c=c.replace(cm[0],`color: ${FG}; /* edicion rosa oct-2026 */\n  background-color: ${BG};`);
const r=gql(`mutation($id:ID!,$files:[OnlineStoreThemeFilesUpsertFileInput!]!){themeFilesUpsert(themeId:$id,files:$files){upsertedThemeFiles{filename}userErrors{field message code}}}`,{id:THEME,files:[{filename:FILES[0],body:{type:"TEXT",value:h}},{filename:FILES[1],body:{type:"TEXT",value:c}}]},true);
console.log(JSON.stringify(r.themeFilesUpsert));
