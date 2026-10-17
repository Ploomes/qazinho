import { stripAnsi } from '@/main/library';

/** Every line a command printed in this chunk, keeping only the last state of a line redrawn with a carriage return. */
export function linesOf(chunk: string): string[] {
  return stripAnsi(chunk)
    .split('\n')
    .map((line) => (line.split('\r').at(-1) ?? '').trim())
    .filter((line) => line.length > 0);
}
