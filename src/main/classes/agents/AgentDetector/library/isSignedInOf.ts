/**
 * Lê o status de login do próprio agente: o Claude Code responde JSON, o Codex responde
 * uma linha e o código de saída.
 */
export function isSignedInOf(props: {
  reads: 'claude' | 'codex';
  code: number;
  printed: string;
}): boolean | null {
  if (props.reads === 'codex') {
    if (/not logged in/i.test(props.printed)) return false;

    return props.code === 0 && /logged in/i.test(props.printed) ? true : null;
  }

  try {
    const status = JSON.parse(props.printed) as { loggedIn?: unknown };

    return typeof status.loggedIn === 'boolean' ? status.loggedIn : null;
  } catch {
    return null;
  }
}
