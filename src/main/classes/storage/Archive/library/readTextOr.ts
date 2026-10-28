import { readFile } from 'node:fs/promises';

/** Um arquivo que ainda não existe não é um erro: é um QAzinho que nunca foi usado. */
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
