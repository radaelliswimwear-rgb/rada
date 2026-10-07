// Asigna los videos subidos por la duena (2026-10-07): hero y Aurora Viva = C1150 (playa), Oasis Natural = DJI (estudio negro), Espuma de Ola = copy_ (verde olivo). Reversion: revert-videos-index.json
import fs from "node:fs"; import path from "node:path"; import os from "node:os"; import { spawnSync } from "node:child_process";
const STORE="wgcvpd-ib.myshopify.com", THEME="gid://shopify/OnlineStoreTheme/191904514347"; const TMP=fs.mkdtempSync(path.join(os.tmpdir(),"vv-")); let n=0;
function gql(q,v,mut){const a=path.join(TMP,`q${++n}.graphql`),b=path.join(TMP,`v${n}.json`);fs.writeFileSync(a,q);fs.writeFileSync(b,JSON.stringify(v||{}));const args=["store","execute","--store",STORE,"--query-file",a,"--variable-file",b,"--json","--no-color"];if(mut)args.push("--allow-mutations");const r=spawnSync("shopify.cmd",args,{encoding:"utf8",shell:true,maxBuffer:256*1024*1024});const o=(r.stdout||"").replace(/\u001b\[[0-9;]*[A-Za-z]/g,"");return JSON.parse(o.slice(o.indexOf("{")));}
const cur=gql(`query($id:ID!){theme(id:$id){role files(first:1,filenames:["templates/index.json"]){nodes{body{...on OnlineStoreThemeFileBodyText{content}}}}}}`,{id:THEME}).theme;
if(cur.role!=="MAIN")throw new Error("no MAIN"); const raw=cur.files.nodes[0].body.content; fs.writeFileSync("revert-videos-index.json",raw,"utf8");
const m=raw.match(/^(\s*\/\*[\s\S]*?\*\/\s*)/); const head=m?m[1]:""; const j=JSON.parse(raw.slice(head.length));
const V=(f)=>"shopify://files/videos/"+f;
j.sections.hero.settings.hero_video=V("C1150.mov");
const b=j.sections["featured-categories"].blocks; b["aurora-viva"].settings.video=V("C1150.mov"); b["oasis-natural"].settings.video=V("DJI_20260712110529_0095_D.mov"); b["espuma-de-ola"].settings.video=V("copy_0BFB8F51-3BCE-408D-B2BD-64F3B3D9D46B.MOV");
const out=head+JSON.stringify(j,null,2)+"\n";
const r=gql(`mutation($id:ID!,$files:[OnlineStoreThemeFilesUpsertFileInput!]!){themeFilesUpsert(themeId:$id,files:$files){upsertedThemeFiles{filename}userErrors{field message code}}}`,{id:THEME,files:[{filename:"templates/index.json",body:{type:"TEXT",value:out}}]},true);
console.log(JSON.stringify(r.themeFilesUpsert));
