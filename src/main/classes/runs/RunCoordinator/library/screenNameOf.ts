/** O nome de uma tela tirado do endereço: o caminho, ou o host na raiz do site. */
export function screenNameOf(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, '');

    return path === '' ? parsed.host : `${path}${parsed.search}`;
  } catch {
    return url;
  }
}
