/** O dia de um instante no relógio desta máquina, como AAAA-MM-DD. */
export function dayKeyOf(at: number): string {
  const day = new Date(at);

  return [
    String(day.getFullYear()),
    String(day.getMonth() + 1).padStart(2, '0'),
    String(day.getDate()).padStart(2, '0'),
  ].join('-');
}
