/**
 * A conta que uma resposta de usuário do GitHub nomeia, ou null quando o corpo não é uma.
 */
export function loginIn(body: string): string | null {
  try {
    const user = JSON.parse(body) as { login?: unknown };

    return typeof user.login === 'string' && user.login !== '' ? user.login : null;
  } catch {
    return null;
  }
}
