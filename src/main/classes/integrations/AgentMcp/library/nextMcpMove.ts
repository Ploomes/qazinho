import type { McpMove } from '@/main/classes/integrations/AgentMcp/types';
import { TERMINAL_KEYS } from '@/main/classes/agents/AgentTerminal/constants';

const SELECTED = '❯';

const CONNECTED = '✔';

const OPTION = /^\s*(?:❯\s*)?\d+\.\s/;

const AUTHENTICATE = /\bauthenticate\b/i;

const REFUSED =
  /failed to authenticate|authentication failed|rejected them|still unauthorized|connection failed/i;

const REFUSED_ALONE = /reconnection failed after authentication/i;

/**
 * The next move on Claude Code's `/mcp` screens toward the server's sign-in, read off the
 * rows the agent shows.
 */
export function nextMcpMove(props: {
  rows: string[];
  server: { name: string; url: string };
}): McpMove {
  const { rows, server } = props;
  const refused = rows.find(
    (row) =>
      REFUSED_ALONE.test(row) ||
      (REFUSED.test(row) && row.toLowerCase().includes(server.name.toLowerCase())),
  );

  if (refused !== undefined) return { kind: 'refused', said: refused.trim() };
  if (rows.some((row) => row.includes('Authentication successful')))
    return { kind: 'connected' };
  if (rows.some((row) => row.includes('Authenticating with')))
    return { kind: 'authorizing' };

  const detail = rows.findIndex((row) => /MCP Server$/.test(row.trim()));

  if (detail !== -1) return inServer({ rows: rows.slice(detail), url: server.url });

  const menu = rows.findIndex((row) => row.includes('Manage MCP servers'));

  if (menu !== -1) return inServers({ rows: rows.slice(menu), name: server.name });

  const trust = rows.findIndex((row) => row.includes('Yes, I trust this folder'));
  const selected = rows.findIndex((row) => row.includes(SELECTED));

  if (trust !== -1 && selected !== -1)
    return toward({ from: selected, to: trust, step: 'open' });

  return { kind: 'wait' };
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toward = (props: {
  from: number;
  to: number;
  step: 'open' | 'authorize';
}): McpMove => ({
  kind: 'press',
  keys:
    props.from === props.to
      ? TERMINAL_KEYS.enter
      : props.from < props.to
        ? TERMINAL_KEYS.down
        : TERMINAL_KEYS.up,
  step: props.step,
});

const inServer = (props: { rows: string[]; url: string }): McpMove => {
  const address = props.rows.find((row) => /^\s*URL:/.test(row)) ?? '';
  const status = props.rows.find((row) => /^\s*Status:/.test(row)) ?? '';

  if (!address.includes(props.url))
    return { kind: 'press', keys: TERMINAL_KEYS.escape, step: 'authorize' };

  if (status.includes(CONNECTED)) return { kind: 'connected' };

  const options = props.rows.flatMap((row, at) => (OPTION.test(row) ? [at] : []));
  const signIn = options.find((at) => AUTHENTICATE.test(props.rows[at] ?? ''));
  const selected = options.find((at) => props.rows[at]?.includes(SELECTED));

  if (options.length === 0 || selected === undefined) return { kind: 'wait' };
  if (signIn === undefined) return { kind: 'refused', said: status.trim() };

  return toward({ from: selected, to: signIn, step: 'authorize' });
};

const inServers = (props: { rows: string[]; name: string }): McpMove => {
  const own = new RegExp(
    `^\\s*(?:${SELECTED}\\s*)?\\S\\s+${escapeRegExp(props.name)}(?:\\s{2,}|$)`,
  );
  const at = props.rows.findIndex((row) => own.test(row));
  const selected = props.rows.findIndex((row) => row.includes(SELECTED));

  if (at === -1 || selected === -1) return { kind: 'wait' };
  if (props.rows[at]?.replace(SELECTED, '').trim().startsWith(CONNECTED))
    return { kind: 'connected' };

  return toward({ from: selected, to: at, step: 'authorize' });
};
