import { describe, expect, it } from 'vitest';
import { TERMINAL_KEYS } from '@/main/classes/agents/AgentTerminal/constants';
import { nextMcpMove } from '@/main/classes/integrations/AgentMcp/library';

/**
 * Linhas como o Claude Code 2.1 as desenha, lidas de volta de uma sessão real; só a pasta
 * home foi mudada.
 */
const FIGMA = { name: 'figma', url: 'https://mcp.figma.com/mcp' };

const HEADER = [
  ' ▐▛███▛█   Claude Code v2.1.302',
  '▝▜██████▀  Opus 5.5 (1M context) · Claude Max',
  ' ▝▝   ▝▝   /Users/qa/Library/Application Support/QAzinho/agent',
  '',
];

function servers(props: { selected: number; figma?: string }) {
  const rows = [
    `⚠ ${'github'.padEnd(30)}needs authentication`,
    props.figma ?? `⚠ ${'figma'.padEnd(30)}needs authentication`,
    `✔ ${'claude.ai Figma'.padEnd(30)}12 tools`,
    `◯ ${'computer-use'.padEnd(30)}disabled`,
  ].map((row, at) => `   ${at === props.selected ? '❯' : ' '} ${row}`);

  return [
    ...HEADER,
    '   Manage MCP servers',
    '   4 servers',
    '',
    '     User MCPs (/Users/qa/.claude.json)',
    ...rows.slice(0, 2),
    '',
    '     claude.ai',
    rows[2] ?? '',
    '',
    '     Built-in MCPs (always available)',
    rows[3] ?? '',
    '   ↑/↓ to navigate · Enter to confirm · Esc to cancel',
  ];
}

function server(props: {
  selected: number;
  url?: string;
  status?: string;
  options?: string[];
}) {
  const options = props.options ?? ['Authenticate', 'Disable'];

  return [
    ...HEADER,
    '   Figma MCP Server',
    `   Status:           ${props.status ?? '⚠ needs authentication'}`,
    '   Auth:             ✘ not authenticated',
    `   URL:              ${props.url ?? FIGMA.url}`,
    '   Config location:  /Users/qa/.claude.json',
    '',
    ...options.map(
      (option, at) =>
        `   ${at === props.selected ? '❯' : ' '} ${String(at + 1)}. ${option}`,
    ),
    '   ↑/↓ to navigate · Enter to select · Esc to back',
  ];
}

function move(rows: string[]) {
  return nextMcpMove({ rows, server: FIGMA });
}

describe('nextMcpMove', () => {
  describe('on the list of servers', () => {
    it('goes down to the server, then opens it', () => {
      expect(move(servers({ selected: 0 }))).toEqual({
        kind: 'press',
        keys: TERMINAL_KEYS.down,
        step: 'authorize',
      });
      expect(move(servers({ selected: 1 }))).toEqual({
        kind: 'press',
        keys: TERMINAL_KEYS.enter,
        step: 'authorize',
      });
    });

    it('goes back up when the selection is past the server', () => {
      expect(move(servers({ selected: 3 }))).toMatchObject({ keys: TERMINAL_KEYS.up });
    });

    it("does NOT take claude.ai's own Figma connector for the server QAzinho added", () => {
      expect(move(servers({ selected: 2 }))).toMatchObject({ keys: TERMINAL_KEYS.up });
    });

    it('reads a server with tools as already connected', () => {
      expect(
        move(servers({ selected: 0, figma: `✔ ${'figma'.padEnd(30)}5 tools` })),
      ).toEqual({ kind: 'connected' });
    });

    it('waits while the server is not listed yet', () => {
      expect(
        move(servers({ selected: 0, figma: '' }).filter((row) => row.trim() !== '')),
      ).toEqual({ kind: 'wait' });
    });
  });

  describe("on the server's own screen", () => {
    it('chooses Authenticate', () => {
      expect(move(server({ selected: 0 }))).toEqual({
        kind: 'press',
        keys: TERMINAL_KEYS.enter,
        step: 'authorize',
      });
      expect(move(server({ selected: 1 }))).toMatchObject({ keys: TERMINAL_KEYS.up });
    });

    it('goes back to the list from another server', () => {
      expect(
        move(server({ selected: 0, url: 'https://mcp.other.test/mcp' })),
      ).toMatchObject({
        keys: TERMINAL_KEYS.escape,
      });
    });

    it('says it is connected once its status is', () => {
      expect(move(server({ selected: 0, status: '✔ connected' }))).toEqual({
        kind: 'connected',
      });
    });

    it('stops when there is no sign-in to choose, saying why', () => {
      expect(
        move(
          server({ selected: 0, status: '✘ failed', options: ['Reconnect', 'Disable'] }),
        ),
      ).toEqual({ kind: 'refused', said: 'Status:           ✘ failed' });
    });
  });

  describe('while signing in', () => {
    it('knows the agent sent the QA to the browser', () => {
      expect(
        move([
          ...HEADER,
          '   Authenticating with figma…',
          '   ·  A browser window will open for authentication',
          '      Return here after authenticating in your browser. Press Esc to go back.',
        ]),
      ).toEqual({ kind: 'authorizing' });
    });

    it('knows the sign-in went through', () => {
      expect(
        move([...HEADER, '   Authentication successful. Connected to figma.']),
      ).toEqual({
        kind: 'connected',
      });
    });

    it('stops on a refusal that names the server, with its words', () => {
      expect(
        move([
          ...HEADER,
          '   Got new credentials, but figma rejected them on reconnect. Try re-authenticating.',
        ]),
      ).toEqual({
        kind: 'refused',
        said: 'Got new credentials, but figma rejected them on reconnect. Try re-authenticating.',
      });
    });

    it("does NOT stop on another server's failure", () => {
      expect(
        move([
          ...servers({ selected: 1 }),
          '   Tried reconnecting to github, but the connection failed',
        ]),
      ).toMatchObject({ kind: 'press' });
    });
  });

  describe('on the folder trust question', () => {
    const trust = (selected: 0 | 1) => [
      '   Accessing workspace:',
      '   /Users/qa/Library/Application Support/QAzinho/agent',
      '   Quick safety check: Is this a project you created or one you trust?',
      `   ${selected === 0 ? '❯' : ' '} No, exit`,
      `   ${selected === 1 ? '❯' : ' '} Yes, I trust this folder`,
      '   Enter to confirm · Esc to cancel',
    ];

    it('moves off "No, exit" before confirming anything', () => {
      expect(move(trust(0))).toEqual({
        kind: 'press',
        keys: TERMINAL_KEYS.down,
        step: 'open',
      });
    });

    it("trusts QAzinho's own folder", () => {
      expect(move(trust(1))).toEqual({
        kind: 'press',
        keys: TERMINAL_KEYS.enter,
        step: 'open',
      });
    });
  });

  it('waits on a screen it does not know', () => {
    expect(move([...HEADER, '   Loading…'])).toEqual({ kind: 'wait' });
    expect(move([])).toEqual({ kind: 'wait' });
  });
});
