/** Um id curto o bastante para o agente copiar de volta. */
export function newMemoryId(): string {
  return `m-${crypto.randomUUID().slice(0, 6)}`;
}
