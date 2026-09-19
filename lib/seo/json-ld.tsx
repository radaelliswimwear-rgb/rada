// Componente compartido para inyectar datos estructurados schema.org
// (Sprint 17). Reemplaza tener que repetir el <script type="application/
// ld+json"> a mano en cada página — mismo patrón que ya usaba
// app/product/[handle]/page.tsx (track Shopify), ahora reutilizable.
//
// Auditoría de seguridad (sep. 2026): JSON.stringify NO escapa el
// caracter "menor que" -- si un campo interpolado (ej. Product.name/
// description, escritos por un admin sin límite de caracteres ni
// sanitización) contiene la subcadena literal de cierre de script, el
// tokenizador HTML del navegador cierra ESTE <script> ahí mismo (sin
// importar su `type`) y todo lo que venga después se parsea como HTML
// normal -- permitiendo inyectar un <script> nuevo que sí se ejecuta (la
// CSP actual permite 'unsafe-inline' en script-src, así que no lo
// bloquea). Reemplazar cada "menor que" por su escape Unicode de 6
// caracteres (mismo truco que usan serialize-javascript y la propia
// documentación de OWASP para JSON embebido en HTML) produce JSON igual
// de válido -- ese escape se decodifica de vuelta al caracter original
// para cualquier parser JSON real (incluido Google, que es quien de
// verdad lee este script) -- pero ya no contiene la secuencia de bytes
// que el navegador interpreta como cierre de script.
export function escapeJsonForScriptTag(json: string): string {
  return json.replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: escapeJsonForScriptTag(JSON.stringify(data)),
      }}
    />
  );
}
