/** Se um nome de anexo vindo da página fica dentro da pasta: sem barra, sem subir. */
export function isStoredName(file: string): boolean {
  return (
    file.length > 0 &&
    !file.includes('/') &&
    !file.includes('\\') &&
    file !== '.' &&
    file !== '..' &&
    !file.startsWith('..')
  );
}
