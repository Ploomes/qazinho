/**
 * O endereço de uma página do site do QAzinho Pro a partir de um caminho que a página
 * pediu; null para um que sairia do site.
 */
export function proPageUrlOf(props: { base: string; path: string }): string | null {
  const { base, path } = props;

  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null;

  try {
    const site = new URL(base);
    const page = new URL(path, site);

    return page.origin === site.origin ? page.toString() : null;
  } catch {
    return null;
  }
}
