/**
 * O nome de uma branch como vai num caminho da API do GitHub: cada parte escapada, as
 * barras entre elas mantidas.
 */
export function refPath(ref: string): string {
  return ref.split('/').map(encodeURIComponent).join('/');
}
