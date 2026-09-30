// 03H: tests-h.js = helpers (cabecera de tests.js) + SOLO el bloque "03H: convergencia" (pruebas Q).
// Sirve para correr los mutantes 52-65 sin repetir la suite completa (la suite completa se corre aparte).
const fs = require("fs");
const path = require("path");
const s = fs.readFileSync(path.join(__dirname, "tests.js"), "utf8");
const head = s.slice(0, s.indexOf("/* ============ Responsive"));
const a = s.indexOf("/* ============ 03H: convergencia");
const b = s.indexOf("/* ============ Diagnóstico del render");
if (a < 0 || b < 0) throw new Error("no se encontró el bloque 03H");
fs.writeFileSync(path.join(__dirname, "tests-h.js"), head + s.slice(a, b) + "window.__done = true;\nrender();\n");
console.log("tests-h.js escrito:", (s.slice(a, b).match(/await test\(/g) || []).length, "pruebas");
