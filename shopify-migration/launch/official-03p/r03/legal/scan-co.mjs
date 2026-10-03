// Auditoria de espanol colombiano (voseo y vocabulario rioplatense) en TODO el contenido: tema (incl. assets js/css), productos, colecciones, paginas, articulos, politicas, menus. Solo lectura.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
const STORE = "wgcvpd-ib.myshopify.com";
const THEME = "gid://shopify/OnlineStoreTheme/191904514347";
const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "co-"));
let n = 0;
function gql(query, variables) {
  const q = path.join(TMP, `q${++n}.graphql`), v = path.join(TMP, `v${n}.json`);
  fs.writeFileSync(q, query); fs.writeFileSync(v, JSON.stringify(variables || {}));
  const r = spawnSync("shopify.cmd", ["store", "execute", "--store", STORE, "--query-file", q, "--variable-file", v, "--json", "--no-color"], { encoding: "utf8", shell: true, maxBuffer: 256 * 1024 * 1024 });
  const out = (r.stdout || "").replace(/\u001b\[[0-9;]*[A-Za-z]/g, ""); const i = out.indexOf("{");
  if (r.status !== 0 || i < 0) throw new Error("gql fallo: " + ((r.stderr || "") + out).slice(0, 500));
  return JSON.parse(out.slice(i));
}
const W = "(?<![\\p{L}])", E = "(?![\\p{L}])";
const WORDS = [
  // voseo (imperativo/presente con acento final)
  "[A-Za-zÁÉÍÓÚáéíóúñ]{2,}(?:á|é|í)(?:la|lo|las|los|me|te|se|nos)?", // se filtra abajo con lista
];
const VOSEO = ["Dejá","dejá","recibí","Descubrí","descubrí","agregá","Agregá","Guardá","guardá","Recargá","Revisá","revisá","Podés","podés","tenés","Tenés","ingresala","consultá","Consultá","Escribí","escribí","Probá","probá","buscá","Buscá","seguí","Seguí","volvé","Volvé","entrá","Entrá","elegí","Elegí","mirá","Mirá","querés","Querés","sumate","Sumate","unite","Unite","apretá","Apretá","aprovechá","Aprovechá","enterate","Enterate","comprá","Comprá","pedí","Pedí","registrate","Registrate","suscribite","Suscribite","iniciá","Iniciá","tocá","Tocá","hacé","Hacé","ponete","Ponete","vení","Vení","decime","Decime","contanos","Contanos","escribinos","Escribinos","avisame","sos","Sos","vos","Vos","tu favorito, elegí","ahorrá","Ahorrá","armá","Armá","combiná","Combiná","encontrá","Encontrá","explorá","Explorá","filtrá","Filtrá","ordená","Ordená","cambiá","Cambiá","cerrá","Cerrá","abrí","Abrí","compartí","Compartí","copiá","Copiá","pagá","Pagá","finalizá","Finalizá","continuá","Continuá","editá","Editá","eliminá","Eliminá","sumá","Sumá","quitá","Quitá","vaciá","Vaciá","miralo","pensá","Pensá","creá","Creá","accedé","Accedé","descargá","Descargá","subí","Subí","bajá","Bajá","fijate","Fijate","andá","Andá","salí","Salí","ayudanos","Ayudanos","acompañanos","seguinos","Seguinos","visitá","Visitá","conocé","Conocé","gestioná","Gestioná","administrá","Administrá","usá","Usá","probalo","guardalo","agregalo","Agregalo"];
const LEX = ["talle","talles","Talle","Talles","malla","mallas","Malla","Mallas","bikini colaless","colaless","vedetina","pileta","piletas","remera","pollera","campera","zapatillas","ojotas","calce","Calce","che","re lindo","re lindas","boludo","copado","bárbaro","dale","laburo","plata","pibe","pibes","ahorita","heladera","lindísim","fachero","chequear","chequeá","turno","retiro por sucursal","descuento en cuotas","cuotas sin interés","ahora 12","mercado pago","billetera virtual","carrito de compras","remeras","vestido de baño","traje de baño","trajes de baño","bañador","bañadores","chaqueta","calcetines","móvil","ordenador","vale ","coche","zumo","grifo"];
const rx = (ws) => new RegExp(W + "(" + ws.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")" + E, "gu");
const RV = rx(VOSEO), RL = rx(LEX);
const scan = (name, text, hits) => {
  if (!text) return;
  for (const [tag, R] of [["VOSEO", RV], ["LEXICO", RL]]) {
    const m = [...text.matchAll(R)];
    if (m.length) hits.push({ where: name, tipo: tag, n: m.length, palabras: [...new Set(m.map((x) => x[1]))].slice(0, 8), ej: [...new Set(m.slice(0, 3).map((x) => text.slice(Math.max(0, x.index - 45), x.index + 75).replace(/\s+/g, " ")))] });
  }
};
const hits = [];
// 1) tema completo (texto)
const files = gql(`query($id: ID!) { theme(id: $id) { files(first: 250) { nodes { filename } } } }`, { id: THEME }).theme.files.nodes.map((f) => f.filename).filter((f) => /\.(liquid|json|js|css|txt|svg)$/.test(f));
for (let i = 0; i < files.length; i += 15) {
  const chunk = files.slice(i, i + 15);
  const r = gql(`query($id: ID!, $f: [String!]) { theme(id: $id) { files(first: 15, filenames: $f) { nodes { filename body { ... on OnlineStoreThemeFileBodyText { content } } } } } }`, { id: THEME, f: chunk }).theme.files.nodes;
  for (const f of r) scan("tema:" + f.filename, (f.body && f.body.content) || "", hits);
}
// 2) productos (titulo, descripcion, tipo, tags, opciones)
let after = null, prods = 0;
for (;;) {
  const r = gql(`query($a: String) { products(first: 50, after: $a) { pageInfo { hasNextPage endCursor } nodes { handle title descriptionHtml productType tags options { name values } seo { title description } } } }`, { a: after }).products;
  for (const p of r.nodes) { prods++; scan("producto:" + p.handle, [p.title, p.descriptionHtml, p.productType, (p.tags || []).join(" "), p.options.map((o) => o.name + " " + o.values.join(" ")).join(" "), p.seo.title, p.seo.description].join(" | "), hits); }
  if (!r.pageInfo.hasNextPage) break; after = r.pageInfo.endCursor;
}
// 3) colecciones, paginas, articulos, politicas, menus
const c = gql(`query { collections(first: 50) { nodes { handle title descriptionHtml seo { title description } } } pages(first: 50) { nodes { handle title body } } articles(first: 50) { nodes { handle title body } } shop { shopPolicies { type body } } menus(first: 20) { nodes { handle items { title items { title } } } } shop2: shop { name description } }`);
for (const x of c.collections.nodes) scan("coleccion:" + x.handle, [x.title, x.descriptionHtml, x.seo.title, x.seo.description].join(" | "), hits);
for (const x of c.pages.nodes) scan("pagina:" + x.handle, [x.title, x.body].join(" | "), hits);
for (const x of c.articles.nodes) scan("articulo:" + x.handle, [x.title, x.body].join(" | "), hits);
for (const x of c.shop.shopPolicies) scan("politica:" + x.type, x.body, hits);
for (const m of c.menus.nodes) scan("menu:" + m.handle, JSON.stringify(m.items), hits);
scan("tienda:descripcion", c.shop2.description || "", hits);
fs.writeFileSync(path.join(DIR, "scan-co.json"), JSON.stringify({ productos: prods, archivosTema: files.length, hits }, null, 1));
console.log(JSON.stringify({ productos: prods, archivosTema: files.length, total: hits.length }));
for (const h of hits) console.log(`${h.tipo} ${String(h.n).padStart(3)}  ${h.where}  [${h.palabras.join(", ")}]  ej: ${h.ej[0]}`);
