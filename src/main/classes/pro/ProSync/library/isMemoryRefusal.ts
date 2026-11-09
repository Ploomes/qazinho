/** Se a plataforma recusou só as memórias, e o resto do projeto ainda pode ir. */
export function isMemoryRefusal(answer: { status: number; error: string }): boolean {
  return (
    answer.status === 400 ||
    answer.error === 'memory_limit' ||
    answer.error === 'not_found'
  );
}
