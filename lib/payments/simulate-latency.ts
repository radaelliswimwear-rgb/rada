// Simula la latencia de red de una pasarela real. Vive en un archivo propio
// para que cada adaptador (providers/*) lo use igual, y para que sea fácil
// de encontrar y borrar el día que las llamadas sean HTTP de verdad.
export function simulateLatency(
  ms: number = 900 + Math.random() * 700,
): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
