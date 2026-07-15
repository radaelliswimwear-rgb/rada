// Componente compartido para inyectar datos estructurados schema.org
// (Sprint 17). Reemplaza tener que repetir el <script type="application/
// ld+json"> a mano en cada página — mismo patrón que ya usaba
// app/product/[handle]/page.tsx (track Shopify), ahora reutilizable.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
