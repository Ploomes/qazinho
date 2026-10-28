import { stripAnsi } from '@/main/library';

/**
 * Toda linha que um comando imprimiu neste pedaço, finais de linha do Windows incluídos,
 * mantendo só o último estado de uma linha redesenhada com carriage return.
 */
export function linesOf(chunk: string): string[] {
  return stripAnsi(chunk)
    .split(/\r?\n/)
    .map((line) => (line.split('\r').at(-1) ?? '').trim())
    .filter((line) => line.length > 0);
}
