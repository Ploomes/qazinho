const PASSWORD =
  /\b(?:senha|password|passwd|pwd|contraseña)\b\s*(?::|=|é|is|de|como|as)?\s*["'“”]?([^\s"'“”,;]{4,})/giu;
const LOOKS_SECRET = /[\d\W_]/u;

/**
 * As senhas que um texto escreve depois da palavra, como "a senha Teste-1234", na ordem
 * em que as escreve; um ${NAME} ou uma palavra comum nunca é uma.
 */
export function passwordsIn(text: string): string[] {
  return [...text.matchAll(PASSWORD)]
    .map(([, value]) => (value ?? '').replace(/[.)]+$/u, ''))
    .filter(
      (value) => value.length >= 4 && !value.startsWith('${') && LOOKS_SECRET.test(value),
    );
}
