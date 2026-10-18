/** How a sign-in started: in Terminal, where the QA finishes it in the agent, or straight in the browser. */
export type McpSignInResult =
  { ok: true; via: 'terminal' | 'browser' } | { ok: false; error: string };
