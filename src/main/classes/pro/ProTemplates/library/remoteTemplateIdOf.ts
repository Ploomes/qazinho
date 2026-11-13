/** O id que a org deu a um modelo guardado aqui como dela, ou null para um local. */
export function remoteTemplateIdOf(id: string): string | null {
  return /^org:[^:]+:(.+)$/.exec(id)?.[1] ?? null;
}
