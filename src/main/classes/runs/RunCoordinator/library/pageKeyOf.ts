/** A página de um endereço, sem a âncora, que só rola a página. */
export function pageKeyOf(url: string): string {
  const at = url.indexOf('#');

  return at === -1 ? url : url.slice(0, at);
}
