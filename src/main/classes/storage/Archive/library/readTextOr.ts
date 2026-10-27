import { readFile } from 'node:fs/promises';

/**
 * A file that is not there yet is not an error: it is a QAzinho that has never been used.
 */
export async function readTextOr(props: {
  file: string;
  fallback: string;
}): Promise<string> {
  try {
    return await readFile(props.file, 'utf8');
  } catch {
    return props.fallback;
  }
}
