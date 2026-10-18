import type { McpSignInProgress, McpSignInStep } from '@/shared/types';
import { existsSync } from 'node:fs';
import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AgentMcp } from '@/main/classes/integrations/AgentMcp';

/**
 * A Claude Code and a Codex that keep their MCP servers in a file next to them, and print what the
 * real ones print (checked against both CLIs in a throwaway config folder). Every call is written
 * down, so the test reads the exact command lines QAzinho sent. The real agents are never touched.
 */
function fakeClaude(root: string) {
  return `#!/bin/sh
echo "$@" >> "${root}/calls"
state="${root}/state"
if [ "$1" = "/mcp" ]; then exec "${process.execPath}" "${root}/tui.mjs" "${root}"; fi
case "$1 $2" in
  "mcp list")
    echo "Checking MCP server health…"; echo ""
    [ -f "$state" ] && echo "figma: https://mcp.figma.com/mcp (HTTP) - $(cat "$state")"
    exit 0 ;;
  "mcp add")
    if [ -f "$state" ]; then echo "MCP server figma already exists in user config" 1>&2; exit 1; fi
    echo "! Needs authentication" > "$state"; exit 0 ;;
  "mcp remove")
    if [ ! -f "$state" ]; then echo 'No MCP server named "figma" in user scope' 1>&2; exit 1; fi
    rm "$state"; exit 0 ;;
esac
exit 2
`;
}

/**
 * Claude Code's \`/mcp\` as a QA sees it, in the rows the real one draws (read off a real session):
 * the folder trust question when \`untrusted\` exists, the servers with GitHub above Figma, Figma's
 * own screen, and the sign-in, which asks $BROWSER to open the page and waits for \`allowed\` or
 * \`denied\`. Like the real one, it ignores keys for a moment after the trust question opens.
 */
const FAKE_MCP_SCREENS = String.raw`
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const root = process.argv[2];
const state = root + '/state';
let screen = existsSync(root + '/untrusted') ? 'trust' : 'loading';
let openedAt = Date.now();
let trustAt = 0;
let listAt = 0;
let serverAt = 0;
let shown = 0;

writeFileSync(root + '/tui.pid', String(process.pid));

const servers = () => [
  { name: 'github', glyph: '⚠', status: 'needs authentication', url: 'https://api.github.test/mcp' },
  ...(existsSync(state)
    ? [{
        name: 'figma',
        glyph: readFileSync(state, 'utf8').includes('Connected') ? '✔' : '⚠',
        status: readFileSync(state, 'utf8').includes('Connected') ? '5 tools' : 'needs authentication',
        url: 'https://mcp.figma.com/mcp',
      }]
    : []),
];
const mark = (on) => (on ? '❯' : ' ');
const rows = () => {
  if (screen === 'loading') return ['   Loading…'];
  if (screen === 'trust')
    return [
      '   Quick safety check: Is this a project you created or one you trust?',
      '',
      '   ' + mark(trustAt === 0) + ' No, exit',
      '   ' + mark(trustAt === 1) + ' Yes, I trust this folder',
      '',
      '   Enter to confirm · Esc to cancel',
    ];
  if (screen === 'list')
    return [
      '   Manage MCP servers',
      '   ' + servers().length + ' servers',
      '',
      '     User MCPs (' + root + '/.claude.json)',
      ...servers().map((item, at) => '   ' + mark(at === listAt) + ' ' + item.glyph + ' ' + item.name.padEnd(30) + item.status),
      '',
      '   ↑/↓ to navigate · Enter to confirm · Esc to cancel',
    ];
  if (screen === 'server') {
    const item = servers()[shown];

    return [
      '   ' + item.name[0].toUpperCase() + item.name.slice(1) + ' MCP Server',
      '   Status:           ' + item.glyph + ' ' + (item.glyph === '✔' ? 'connected' : 'needs authentication'),
      '   URL:              ' + item.url,
      '',
      '   ' + mark(serverAt === 0) + ' 1. Authenticate',
      '   ' + mark(serverAt === 1) + ' 2. Disable',
      '   ↑/↓ to navigate · Enter to select · Esc to back',
    ];
  }
  if (screen === 'signing-in')
    return [
      '   Authenticating with figma…',
      '   ·  A browser window will open for authentication',
      '      Return here after authenticating in your browser. Press Esc to go back.',
    ];
  if (screen === 'refused') return ['   Failed to authenticate with figma: access_denied'];
  return ['   Authentication successful. Connected to figma.'];
};
const draw = () => process.stdout.write('\x1b[H\x1b[2J' + rows().join('\r\n'));
const signIn = () => {
  screen = 'signing-in';
  spawnSync(process.env.BROWSER, ['https://www.figma.com/oauth/mcp?client_id=fake']);

  const answer = setInterval(() => {
    if (existsSync(root + '/allowed')) {
      writeFileSync(state, '✔ Connected');
      screen = 'connected';
    } else if (existsSync(root + '/denied')) screen = 'refused';
    else return;

    clearInterval(answer);
    draw();
  }, 100);
};
const press = (key) => {
  const down = key === '\x1b[B';
  const up = key === '\x1b[A';
  const enter = key === '\r';
  const back = key === '\x1b';

  if (screen === 'trust') {
    if (Date.now() - openedAt < 400) return;
    if (down) trustAt = 1;
    if (up) trustAt = 0;
    if (back || (enter && trustAt === 0)) process.exit(1);
    if (enter) {
      rmSync(root + '/untrusted');
      screen = 'list';
    }
  } else if (screen === 'list') {
    if (down) listAt = Math.min(servers().length - 1, listAt + 1);
    if (up) listAt = Math.max(0, listAt - 1);
    if (back) process.exit(0);
    if (enter) {
      shown = listAt;
      serverAt = 0;
      screen = 'server';
    }
  } else if (screen === 'server') {
    if (down) serverAt = 1;
    if (up) serverAt = 0;
    if (back) screen = 'list';
    if (enter && serverAt === 0 && servers()[shown].name === 'figma') signIn();
  } else if (screen === 'signing-in' && back) screen = 'server';
};

process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');
process.stdin.on('data', (keys) => {
  for (const key of keys.match(/\x1b\[[AB]|\x1b|\r|[^]/g) ?? []) press(key);
  draw();
});
setTimeout(() => {
  if (screen === 'loading') screen = 'list';
  openedAt = Date.now();
  draw();
}, 300);
draw();
`;

/** Codex starts the OAuth flow on add and on login: it prints the address, then waits for the browser. */
function fakeCodex(root: string) {
  return `#!/bin/sh
echo "$@" >> "${root}/calls"
state="${root}/state"
case "$1 $2" in
  "mcp list")
    if [ -f "$state" ]; then
      printf '[{"name":"figma","enabled":true,"transport":{"type":"streamable_http","url":"https://mcp.figma.com/mcp"},"auth_status":"%s"}]' "$(cat "$state")"
    else echo "[]"; fi
    exit 0 ;;
  "mcp add"|"mcp login")
    echo "not_logged_in" > "$state"
    echo "Detected OAuth support. Starting OAuth flow…"
    echo "Authorize \\\`figma\\\` by opening this URL in your browser:"
    echo "https://www.figma.com/oauth/mcp?response_type=code&client_id=abc"
    sleep 1
    echo "o_auth" > "$state"
    exit 0 ;;
  "mcp remove")
    rm -f "$state"; echo "Removed global MCP server 'figma'."; exit 0 ;;
esac
exit 2
`;
}

async function agentsWithFakes() {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-mcp-'));
  const bins = { 'claude-code': join(root, 'claude'), codex: join(root, 'codex') };
  const opened = { urls: [] as string[], scripts: [] as string[] };
  const reported: McpSignInProgress[] = [];

  await writeFile(bins['claude-code'], fakeClaude(root));
  await writeFile(bins.codex, fakeCodex(root));
  await writeFile(join(root, 'tui.mjs'), FAKE_MCP_SCREENS);
  await chmod(bins['claude-code'], 0o755);
  await chmod(bins.codex, 0o755);

  return {
    root,
    opened,
    reported,
    mcp: new AgentMcp({
      findAgent: (agentId) =>
        Promise.resolve(agentId in bins ? bins[agentId as keyof typeof bins] : null),
      openUrl: async (url) => {
        opened.urls.push(url);
      },
      openScript: async (file) => {
        opened.scripts.push(await readFile(file, 'utf8'));
      },
      onProgress: (progress) => {
        reported.push(progress);
      },
      folder: join(root, 'agent'),
    }),
    calls: async () => (await readFile(join(root, 'calls'), 'utf8')).trim().split('\n'),
    /** The QA's answer in the browser, given once the agent sent them there. */
    answer: async (said: 'allowed' | 'denied') => {
      while (opened.urls.length === 0)
        await new Promise((later) => setTimeout(later, 100));

      await writeFile(join(root, said), '');
    },
  };
}

const FIGMA_IN = (agentId: string) => ({ id: 'figma' as const, agentId });
const OUT_OF_SIGHT = (agentId: string) => ({
  target: FIGMA_IN(agentId),
  inTerminal: false,
});

/** The steps a sign-in went through, each once, in the order it reached them. */
const walked = (reported: McpSignInProgress[]): McpSignInStep[] => [
  ...new Set(
    reported.flatMap((progress) => (progress.phase === 'working' ? [progress.at] : [])),
  ),
];

const isGone = async (root: string) => {
  try {
    process.kill(Number(await readFile(join(root, 'tui.pid'), 'utf8')), 0);

    return false;
  } catch {
    return true;
  }
};

describe.skipIf(!existsSync('/usr/bin/expect'))(
  "Figma's MCP in the QA's Claude Code",
  () => {
    it('adds it, then signs in out of sight, opening only the page Claude Code asked for', async () => {
      const { mcp, calls, opened, reported, answer, root } = await agentsWithFakes();

      expect(await mcp.list('claude-code')).toEqual([{ id: 'figma', state: 'missing' }]);

      const [ended] = await Promise.all([
        mcp.connect(OUT_OF_SIGHT('claude-code')),
        answer('allowed'),
      ]);

      expect(ended).toMatchObject({
        phase: 'connected',
        steps: ['check', 'add', 'open', 'authorize', 'browser'],
      });
      expect(walked(reported)).toEqual(['check', 'add', 'open', 'authorize', 'browser']);
      expect(await calls()).toContain(
        'mcp add --transport http --scope user figma https://mcp.figma.com/mcp',
      );
      expect(opened).toEqual({
        urls: ['https://www.figma.com/oauth/mcp?client_id=fake'],
        scripts: [],
      });
      expect(await mcp.list('claude-code')).toEqual([
        { id: 'figma', state: 'connected' },
      ]);

      await new Promise((later) => setTimeout(later, 500));

      expect(await isGone(root)).toBe(true);
    });

    it('trusts its own folder first, never taking "No, exit"', async () => {
      const { mcp, answer, root } = await agentsWithFakes();

      await writeFile(join(root, 'untrusted'), '');

      const [ended] = await Promise.all([
        mcp.connect(OUT_OF_SIGHT('claude-code')),
        answer('allowed'),
      ]);

      expect(ended.phase).toBe('connected');
      expect(existsSync(join(root, 'untrusted'))).toBe(false);
    });

    it('signs in without adding twice when the server is already there', async () => {
      const { mcp, calls, answer, root } = await agentsWithFakes();

      await writeFile(join(root, 'state'), '! Needs authentication\n');

      const [ended] = await Promise.all([
        mcp.connect(OUT_OF_SIGHT('claude-code')),
        answer('allowed'),
      ]);

      expect(ended).toMatchObject({
        phase: 'connected',
        steps: ['check', 'open', 'authorize', 'browser'],
      });
      expect((await calls()).some((line) => line.startsWith('mcp add'))).toBe(false);
    });

    it("stops with Figma's refusal, in the agent's words", async () => {
      const { mcp, answer } = await agentsWithFakes();

      const [ended] = await Promise.all([
        mcp.connect(OUT_OF_SIGHT('claude-code')),
        answer('denied'),
      ]);

      expect(ended).toMatchObject({
        phase: 'failed',
        at: 'browser',
        failure: 'refused',
        said: 'Failed to authenticate with figma: access_denied',
        canUseTerminal: false,
      });
    });

    it('cancels while the QA is in the browser, and closes the hidden agent', async () => {
      const { mcp, opened, root } = await agentsWithFakes();
      const connecting = mcp.connect(OUT_OF_SIGHT('claude-code'));

      while (opened.urls.length === 0)
        await new Promise((later) => setTimeout(later, 100));

      mcp.cancel(FIGMA_IN('claude-code'));

      expect(await connecting).toMatchObject({ phase: 'cancelled' });

      await new Promise((later) => setTimeout(later, 500));

      expect(await isGone(root)).toBe(true);
    });

    it('opens Terminal when the QA asks for it, and reads the sign-in back from the agent', async () => {
      const { mcp, opened, reported, root } = await agentsWithFakes();
      const connecting = mcp.connect({
        target: FIGMA_IN('claude-code'),
        inTerminal: true,
      });

      while (opened.scripts.length === 0)
        await new Promise((later) => setTimeout(later, 100));

      expect(opened.scripts[0]).toMatch(/exec '.+\/claude' '\/mcp'/);
      expect(reported.at(-1)).toMatchObject({ phase: 'working', at: 'terminal' });

      await writeFile(join(root, 'state'), '✔ Connected\n');

      expect(await connecting).toMatchObject({
        phase: 'connected',
        steps: ['check', 'add', 'terminal'],
      });
    });

    it('counts removing twice as done, not as an error', async () => {
      const { mcp, root } = await agentsWithFakes();

      await writeFile(join(root, 'state'), '! Needs authentication\n');

      expect(await mcp.remove(FIGMA_IN('claude-code'))).toEqual({ ok: true });
      expect(await mcp.remove(FIGMA_IN('claude-code'))).toEqual({ ok: true });
    });
  },
);

describe("Figma's MCP in the QA's Codex", () => {
  it('adds it, opens the sign-in address in the browser, and ends connected once allowed', async () => {
    const { mcp, calls, opened, reported } = await agentsWithFakes();

    expect(await mcp.connect(OUT_OF_SIGHT('codex'))).toMatchObject({
      phase: 'connected',
      steps: ['check', 'add', 'browser'],
    });
    expect(walked(reported)).toEqual(['check', 'add', 'browser']);
    expect(
      reported.find(
        (progress) => progress.phase === 'working' && progress.at === 'browser',
      ),
    ).toMatchObject({
      url: 'https://www.figma.com/oauth/mcp?response_type=code&client_id=abc',
    });
    expect(await calls()).toContain('mcp add figma --url https://mcp.figma.com/mcp');
    expect(opened.urls).toEqual([
      'https://www.figma.com/oauth/mcp?response_type=code&client_id=abc',
    ]);
    expect(await mcp.list('codex')).toEqual([{ id: 'figma', state: 'connected' }]);
  });

  it('logs in again, without adding twice, when it is there but signed out', async () => {
    const { mcp, calls, root } = await agentsWithFakes();

    await writeFile(join(root, 'state'), 'not_logged_in\n');

    expect(await mcp.connect(OUT_OF_SIGHT('codex'))).toMatchObject({
      phase: 'connected',
      steps: ['check', 'browser'],
    });
    expect(await calls()).toContain('mcp login figma');
    expect((await calls()).some((line) => line.startsWith('mcp add'))).toBe(false);
  });
});

describe('an agent QAzinho cannot set up', () => {
  it('says so for an agent with no recipe, and for one not on the machine', async () => {
    const { mcp } = await agentsWithFakes();
    const none = new AgentMcp({
      findAgent: () => Promise.resolve(null),
      openUrl: () => Promise.resolve(),
      openScript: () => Promise.resolve(),
      onProgress: () => undefined,
      folder: tmpdir(),
    });

    expect(await mcp.list('future-cli')).toEqual([{ id: 'figma', state: 'unsupported' }]);
    expect(await none.list('claude-code')).toEqual([{ id: 'figma', state: 'no-agent' }]);
    expect(await mcp.connect(OUT_OF_SIGHT('future-cli'))).toMatchObject({
      phase: 'failed',
      at: 'check',
      failure: 'unsupported',
    });
  });
});
