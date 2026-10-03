import fs from "node:fs"; import path from "node:path"; import os from "node:os"; import { spawnSync } from "node:child_process";
const STORE="wgcvpd-ib.myshopify.com", THEME="gid://shopify/OnlineStoreTheme/191904514347"; const TMP=fs.mkdtempSync(path.join(os.tmpdir(),"pk-")); let n=0;
function gql(q,v){const a=path.join(TMP,`q${++n}.graphql`),b=path.join(TMP,`v${n}.json`);fs.writeFileSync(a,q);fs.writeFileSync(b,JSON.stringify(v||{}));const r=spawnSync("shopify.cmd",["store","execute","--store",STORE,"--query-file",a,"--variable-file",b,"--json","--no-color"],{encoding:"utf8",shell:true,maxBuffer:256*1024*1024});const o=(r.stdout||"").replace(/\u001b\[[0-9;]*[A-Za-z]/g,"");return JSON.parse(o.slice(o.indexOf("{")));}
const f=["sections/header-group.json","sections/announcement-bar.liquid","assets/section-header.css","assets/component-card.css"];
const r=gql(`query($id:ID!,$f:[String!]){theme(id:$id){files(first:10,filenames:$f){nodes{filename body{...on OnlineStoreThemeFileBodyText{content}}}}}}`,{id:THEME,f}).theme.files.nodes;
fs.mkdirSync("promo-before",{recursive:true});
for(const x of r){fs.writeFileSync("promo-before/"+x.filename.replace("/","__"),x.body.content,"utf8");}
console.log(r.map(x=>x.filename+" "+x.body.content.length).join("\n"));