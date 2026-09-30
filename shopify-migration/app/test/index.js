/**
 * Punto de entrada de la suite para `node --test app/test` (o `node --test
 * test/` desde app/). En Node >= 22 `--test <carpeta>` resuelve la carpeta
 * como módulo (este index.js); acá se importan todos los *.test.mjs en orden
 * alfabético. mutants.mjs y helpers.mjs NO se importan.
 */
import { readdirSync } from "node:fs";

const directory = new URL("./", import.meta.url);
const files = readdirSync(directory)
  .filter((name) => name.endsWith(".test.mjs"))
  .sort();

for (const name of files) {
  await import(new URL(name, directory).href);
}
