import fs from "node:fs"; import path from "node:path"; import os from "node:os"; import { spawnSync } from "node:child_process";
const STORE="wgcvpd-ib.myshopify.com", THEME="gid://shopify/OnlineStoreTheme/191904514347"; const TMP=fs.mkdtempSync(path.join(os.tmpdir(),"vd-")); let n=0;
function gql(q,v){const a=path.join(TMP,`q${++n}.graphql`),b=path.join(TMP,`v${n}.json`);fs.writeFileSync(a,q);fs.writeFileSync(b,JSON.stringify(v||{}));const r=spawnSync("shopify.cmd",["store","execute","--store",STORE,"--query-file",a,"--variable-file",b,"--json","--no-color"],{encoding:"utf8",shell:true,maxBuffer:256*1024*1024});const o=(r.stdout||"").replace(/\u001b\[[0-9;]*[A-Za-z]/g,"");return JSON.parse(o.slice(o.indexOf("{")));}
const names=gql(`query($id:ID!){theme(id:$id){files(first:250){nodes{filename}}}}`,{id:THEME}).theme.files.nodes.map(f=>f.filename);
console.log("video-ish files:",names.filter(f=>/video|hero/i.test(f)).join(", "));
const r=gql(`query($id:ID!,$f:[String!]){theme(id:$id){files(first:5,filenames:$f){nodes{filename body{...on OnlineStoreThemeFileBodyText{content}}}}}}`,{id:THEME,f:["templates/index.json","sections/hero.liquid"]}).theme.files.nodes;
for(const x of r){fs.writeFileSync("dump-"+x.filename.replace("/","__"),x.body.content,"utf8");console.log(x.filename,x.body.content.length);}
const q=gql(`query{files(first:50,query:"media_type:Video"){nodes{id alt fileStatus ... on Video{originalSource{url}}}}}`);console.log(JSON.stringify(q).slice(0,800));
