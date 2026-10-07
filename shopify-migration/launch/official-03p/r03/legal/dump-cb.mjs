import fs from "node:fs"; import path from "node:path"; import os from "node:os"; import { spawnSync } from "node:child_process";
const STORE="wgcvpd-ib.myshopify.com", THEME="gid://shopify/OnlineStoreTheme/191904514347"; const TMP=fs.mkdtempSync(path.join(os.tmpdir(),"cb-")); let n=0;
function gql(q,v){const a=path.join(TMP,`q${++n}.graphql`),b=path.join(TMP,`v${n}.json`);fs.writeFileSync(a,q);fs.writeFileSync(b,JSON.stringify(v||{}));const r=spawnSync("shopify.cmd",["store","execute","--store",STORE,"--query-file",a,"--variable-file",b,"--json","--no-color"],{encoding:"utf8",shell:true,maxBuffer:256*1024*1024});const o=(r.stdout||"").replace(/\u001b\[[0-9;]*[A-Za-z]/g,"");return JSON.parse(o.slice(o.indexOf("{")));}
const c=gql(`{collections(first:20){nodes{id handle metafields(first:20,namespace:"custom"){nodes{key type value}}}}}`).collections.nodes;
for(const x of c)console.log(x.handle, JSON.stringify(x.metafields.nodes.map(m=>m.key+"="+String(m.value).slice(0,60))));
const r=gql(`query($id:ID!,$f:[String!]){theme(id:$id){files(first:5,filenames:$f){nodes{filename body{...on OnlineStoreThemeFileBodyText{content}}}}}}`,{id:THEME,f:["snippets/collection-banner.liquid","assets/section-header.css"]}).theme.files.nodes;
for(const x of r)fs.writeFileSync("dump-"+x.filename.replace("/","__"),x.body.content,"utf8");
const css=r.find(x=>x.filename.includes("section-header")).body.content; console.log("--- backdrop/sticky en header css:"); console.log(css.split("\n").filter(l=>/backdrop|sticky|blur|position: fixed/i.test(l)).join("\n"));
