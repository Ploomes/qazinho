/**
 * Uma URL como a tela do QA a mostra: uma senha digitada nela para basic auth fica de
 * fora.
 */
export function shownUrlOf(url: string): string {
  try {
    const parsed = new URL(url);

    if (parsed.username === '' && parsed.password === '') return url;

    parsed.username = '';
    parsed.password = '';

    return parsed.toString();
  } catch {
    return url;
  }
}
