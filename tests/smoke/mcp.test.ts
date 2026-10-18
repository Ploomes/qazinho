import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AgentMcp } from '@/main/classes/integrations/AgentMcp';

/**
 * A Claude Code that keeps its MCP servers in a file next to it and answers `mcp list`, `add` and
 * `remove` the way the real one prints them. Every call is written down, so the test reads the
 * exact command lines QAzinho sent. The real one is never touched.
 */
function fakeClaude(root: string) {
  return `#!/bin/sh
echo "$@" >> "${root}/calls"
state="${root}/state"
case "$1 $2" in
  "mcp list")
    echo "Checking MCP server health…"
    echo ""
    [ -f "$state" ] && echo "figma: https://mcp.figma.com/mcp (HTTP) - $(cat "$state")"
    exit 0 ;;
  "mcp add")
    if [ -f "$state" ]; then echo "MCP server figma already exists in user config" 1>&2; exit 1; fi
    echo "! Needs authentication" > "$state"
    exit 0 ;;
  "mcp remove")
    if [ ! -f "$state" ]; then echo "No user-scoped MCP server found with name: figma" 1>&2; exit 1; fi
    rm "$state"
    exit 0 ;;
esac
exit 2
`;
}

async function agentWithFake() {
  const root = await mkdtemp(join(tmpdir(), 'qazinho-mcp-'));
  const claude = join(root, 'claude');

  await writeFile(claude, fakeClaude(root));
  await chmod(claude, 0o755);

  return {
    root,
    mcp: new AgentMcp({
      findClaude: () => Promise.resolve(claude),
      folder: join(root, 'agent'),
    }),
    calls: async () => (await readFile(join(root, 'calls'), 'utf8')).trim().split('\n'),
  };
}

describe("an MCP server in the QA's Claude Code", () => {
  it('adds Figma for every project, and then reads it as waiting for a sign-in', async () => {
    const { mcp, calls } = await agentWithFake();

    expect(await mcp.list()).toEqual([{ id: 'figma', state: 'missing' }]);
    expect(await mcp.add('figma')).toEqual({ ok: true });
    expect(await mcp.list()).toEqual([{ id: 'figma', state: 'needs-auth' }]);
    expect(await calls()).toContain(
      'mcp add --transport http --scope user figma https://mcp.figma.com/mcp',
    );
  });

  it('counts adding twice and removing twice as done, not as errors', async () => {
    const { mcp } = await agentWithFake();

    expect(await mcp.add('figma')).toEqual({ ok: true });
    expect(await mcp.add('figma')).toEqual({ ok: true });
    expect(await mcp.remove('figma')).toEqual({ ok: true });
    expect(await mcp.remove('figma')).toEqual({ ok: true });
    expect(await mcp.list()).toEqual([{ id: 'figma', state: 'missing' }]);
  });

  it('reads a signed-in server as connected', async () => {
    const { mcp, root } = await agentWithFake();

    await writeFile(join(root, 'state'), '✓ Connected\n');

    expect(await mcp.list()).toEqual([{ id: 'figma', state: 'connected' }]);
  });

  it('says there is no agent when Claude Code is not on the machine', async () => {
    const mcp = new AgentMcp({
      findClaude: () => Promise.resolve(null),
      folder: tmpdir(),
    });

    expect(await mcp.list()).toEqual([{ id: 'figma', state: 'no-agent' }]);
    expect(await mcp.add('figma')).toMatchObject({ ok: false });
  });
});
