import { randomUUID } from 'node:crypto';
import { rename, rm, writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const RENAME_TRIES = 5;
const RENAME_WAIT_MS = 40;

/**
 * Writes a file whole or not at all: a copy beside it, renamed over it, so a crash never
 * leaves it cut in half.
 */
export async function writeAtomically(props: {
  file: string;
  data: string | Uint8Array;
}): Promise<void> {
  const { file, data } = props;
  const copy = `${file}.${randomUUID()}.tmp`;

  await writeFile(copy, data);

  for (let attempt = 1; ; attempt += 1) {
    try {
      await rename(copy, file);

      return;
    } catch (error) {
      if (attempt >= RENAME_TRIES) {
        await rm(copy, { force: true });
        throw error;
      }

      await sleep(RENAME_WAIT_MS * attempt);
    }
  }
}
