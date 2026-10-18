/** Reads an agent's own sign-in status: Claude Code answers JSON, Codex answers a line and its exit code. */
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
