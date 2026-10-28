/**
 * A pasta em que um arquivo da suíte fica, a partir da pasta da própria suíte: '' para um
 * arquivo na raiz.
 */
export function folderOf(file: string): string {
  const at = file.lastIndexOf('/');

  return at === -1 ? '' : file.slice(0, at);
}
