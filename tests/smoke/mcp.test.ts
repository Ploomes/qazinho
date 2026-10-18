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

  await writeFile(bins['claude-code'], fakeClaude(root));
  await writeFile(bins.codex, fakeCodex(root));
  await chmod(bins['claude-code'], 0o755);
  await chmod(bins.codex, 0o755);

  return {
    root,
    opened,
    mcp: new AgentMcp({
      findAgent: (agentId) =>
        Promise.resolve(agentId in bins ? bins[agentId as keyof typeof bins] : null),
      openUrl: async (url) => {
        opened.urls.push(url);
      },
      openScript: async (file) => {
        opened.scripts.push(await readFile(file, 'utf8'));
      },
      folder: join(root, 'agent'),
    }),
    calls: async () => (await readFile(join(root, 'calls'), 'utf8')).trim().split('\n'),
  };
}

const FIGMA_IN = (agentId: string) => ({ id: 'figma' as const, agentId });

describe("Figma's MCP in the QA's Claude Code", () => {
  it('adds it for every project, then opens Terminal on the sign-in', async () => {
    const { mcp, calls, opened } = await agentsWithFakes();

    expect(await mcp.list('claude-code')).toEqual([{ id: 'figma', state: 'missing' }]);
    expect(await mcp.connect(FIGMA_IN('claude-code'))).toEqual({
      ok: true,
      via: 'terminal',
    });
    expect(await calls()).toContain(
      'mcp add --transport http --scope user figma https://mcp.figma.com/mcp',
    );
    expect(opened.scripts[0]).toMatch(/exec '.+\/claude' '\/mcp'/);
    expect(await mcp.list('claude-code')).toEqual([{ id: 'figma', state: 'needs-auth' }]);
  });

  it('only opens the sign-in for a server already added', async () => {
    const { mcp, calls } = await agentsWithFakes();

    await mcp.connect(FIGMA_IN('claude-code'));
    await mcp.connect(FIGMA_IN('claude-code'));

    expect((await calls()).filter((line) => line.startsWith('mcp add'))).toHaveLength(1);
  });

  it('counts removing twice as done, not as an error', async () => {
    const { mcp } = await agentsWithFakes();

    await mcp.connect(FIGMA_IN('claude-code'));

    expect(await mcp.remove(FIGMA_IN('claude-code'))).toEqual({ ok: true });
    expect(await mcp.remove(FIGMA_IN('claude-code'))).toEqual({ ok: true });
  });
});

describe("Figma's MCP in the QA's Codex", () => {
  it('adds it, opens the sign-in address in the browser, and reads it connected once allowed', async () => {
    const { mcp, calls, opened } = await agentsWithFakes();

    expect(await mcp.connect(FIGMA_IN('codex'))).toEqual({ ok: true, via: 'browser' });
    expect(await calls()).toContain('mcp add figma --url https://mcp.figma.com/mcp');
    expect(opened.urls).toEqual([
      'https://www.figma.com/oauth/mcp?response_type=code&client_id=abc',
    ]);
    expect(await mcp.list('codex')).toEqual([{ id: 'figma', state: 'needs-auth' }]);

    await new Promise((later) => setTimeout(later, 1_500));

    expect(await mcp.list('codex')).toEqual([{ id: 'figma', state: 'connected' }]);
  });

  it('logs in again, without adding twice, when it is there but signed out', async () => {
    const { mcp, calls, root } = await agentsWithFakes();

    await writeFile(join(root, 'state'), 'not_logged_in\n');
    await mcp.connect(FIGMA_IN('codex'));

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
      folder: tmpdir(),
    });

    expect(await mcp.list('gemini-cli')).toEqual([{ id: 'figma', state: 'unsupported' }]);
    expect(await none.list('claude-code')).toEqual([{ id: 'figma', state: 'no-agent' }]);
    expect(await mcp.connect(FIGMA_IN('gemini-cli'))).toMatchObject({ ok: false });
  });
});
