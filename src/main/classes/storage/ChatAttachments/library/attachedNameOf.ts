const STORED_PREFIX = /^[0-9a-f]{8}-/;

/** O nome com que o QA anexou um arquivo, sem o id com que ele fica na pasta. */
export function attachedNameOf(stored: string): string {
  return stored.replace(STORED_PREFIX, '');
}
