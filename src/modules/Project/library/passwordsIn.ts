const PASSWORD =
  /\b(?:senha|password|passwd|pwd|contraseña)\b\s*(?::|=|é|is|de|como|as)?\s*["'“”]?([^\s"'“”,;]{4,})/giu;
const LOOKS_SECRET = /[\d\W_]/u;

/**
 * The passwords a text writes out after the word, such as "a senha Teste-1234", in the
 * order it writes them; a ${NAME} or a plain word is never one.
 */
export function passwordsIn(text: string): string[] {
  return [...text.matchAll(PASSWORD)]
    .map(([, value]) => (value ?? '').replace(/[.)]+$/u, ''))
    .filter(
      (value) => value.length >= 4 && !value.startsWith('${') && LOOKS_SECRET.test(value),
    );
}
