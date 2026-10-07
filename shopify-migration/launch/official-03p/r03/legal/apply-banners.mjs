// Banners de coleccion: importa las 4 imagenes originales (Cloudinary del sitio anterior) a Shopify Files y llena custom.cover_image + encuadre (image_pos_x/y, zoom).
// Reversion: node apply-banners.mjs --revert (vacia los metafields; deja los archivos en Files).
import fs from "node:fs"; import path from "node:path"; import os from "node:os"; import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com"; const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "bn-")); let n = 0;
function gql(q, v, mut) { const a = path.join(TMP, `q${++n}.graphql`), b = path.join(TMP, `v${n}.json`); fs.writeFileSync(a, q); fs.writeFileSync(b, JSON.stringify(v || {})); const args = ["store", "execute", "--store", STORE, "--query-file", a, "--variable-file", b, "--json", "--no-color"]; if (mut) args.push("--allow-mutations"); const r = spawnSync("shopify.cmd", args, { encoding: "utf8", shell: true, maxBuffer: 256 * 1024 * 1024 }); const o = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); return JSON.parse(o.slice(o.indexOf("{"))); }
const B = "https://res.cloudinary.com/n8l3p85c/image/upload/";
const ITEMS = [
  { handle: "oasis-natural", url: B + "v1787460207/lago/products/x95tyqydlvieasp7whfn.jpg", file: "banner-oasis-natural.jpg", x: 50, y: 26.689976689976692, z: 1 },
  { handle: "aurora-viva", url: B + "v1787420066/lago/products/c9gz6yuipjnowjyp3amd.jpg", file: "banner-aurora-viva.jpg", x: 43.932724252491695, y: 69.97684658575744, z: 1.4 },
  { handle: "espuma-de-ola", url: B + "v1787417045/lago/products/n9to8ksgrw1xmxlxm2ch.jpg", file: "banner-espuma-de-ola.jpg", x: 53.68217054263566, y: 55, z: 1 },
  { handle: "salidas-de-bano", url: B + "c_limit,w_3000,h_3000,q_95/v1787460295/lago/products/grhrfruybukvqgk6ngrc.jpg", file: "banner-salidas-de-bano.jpg", x: 61.62790697674419, y: 59.97214446504011, z: 1.15 },
];
const cols = gql(`{collections(first:20){nodes{id handle}}}`).collections.nodes; const idOf = Object.fromEntries(cols.map((c) => [c.handle, c.id]));
if (process.argv.includes("--revert")) {
  const del = ITEMS.flatMap((i) => ["cover_image", "image_pos_x", "image_pos_y", "zoom"].map((k) => ({ ownerId: idOf[i.handle], namespace: "custom", key: k })));
  console.log(JSON.stringify(gql(`mutation($m:[MetafieldIdentifierInput!]!){metafieldsDelete(metafields:$m){deletedMetafields{key}userErrors{message}}}`, { m: del }, true).metafieldsDelete)); process.exit(0);
}
const created = gql(`mutation($f:[FileCreateInput!]!){fileCreate(files:$f){files{id fileStatus}userErrors{field message code}}}`, { f: ITEMS.map((i) => ({ originalSource: i.url, contentType: "IMAGE", alt: "Banner " + i.handle, filename: i.file })) }, true).fileCreate;
console.log("fileCreate:", JSON.stringify(created.userErrors)); const ids = created.files.map((f) => f.id);
for (let t = 0; t < 30; t++) { const st = gql(`query($i:[ID!]!){nodes(ids:$i){... on MediaImage{id fileStatus image{width height}}}}`, { i: ids }).nodes; if (st.every((x) => x.fileStatus === "READY")) { st.forEach((x, k) => console.log(ITEMS[k].handle, x.image.width + "x" + x.image.height)); break; } if (t === 29) throw new Error("archivos no listos"); spawnSync("powershell", ["-NoProfile", "-Command", "Start-Sleep 4"]); }
const metas = ITEMS.flatMap((it, k) => [
  { ownerId: idOf[it.handle], namespace: "custom", key: "cover_image", type: "file_reference", value: ids[k] },
  { ownerId: idOf[it.handle], namespace: "custom", key: "image_pos_x", type: "number_decimal", value: String(it.x) },
  { ownerId: idOf[it.handle], namespace: "custom", key: "image_pos_y", type: "number_decimal", value: String(it.y) },
  { ownerId: idOf[it.handle], namespace: "custom", key: "zoom", type: "number_decimal", value: String(it.z) },
]);
console.log("metafieldsSet:", JSON.stringify(gql(`mutation($m:[MetafieldsSetInput!]!){metafieldsSet(metafields:$m){metafields{key}userErrors{field message code}}}`, { m: metas }, true).metafieldsSet.userErrors));
