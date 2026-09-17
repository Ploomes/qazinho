import { stripAnsi } from '@/main/library';

/** The last thing a command printed in this chunk. npm and brew redraw their line with a carriage return. */
export function lastLineOf(chunk: string): string {
  return (
    stripAnsi(chunk)
      .split(/[\r\n]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .at(-1) ?? ''
  );
}
