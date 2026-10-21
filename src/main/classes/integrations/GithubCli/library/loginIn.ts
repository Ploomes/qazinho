/** The account a GitHub user answer names, or null when the body is not one. */
export function loginIn(body: string): string | null {
  try {
    const user = JSON.parse(body) as { login?: unknown };

    return typeof user.login === 'string' && user.login !== '' ? user.login : null;
  } catch {
    return null;
  }
}
