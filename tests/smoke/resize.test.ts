import type { IRunEvent } from '@/shared/types';
import { chmod, mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Harness, McpHost } from '@/harness';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';

const PORT = 4342;
const PHONE = { width: 390, height: 844 };

describe('resizing the device mid-run', () => {
  /**
   * The QA switched the device to Phone while the first case walked: the browser shrank, and
   * the next case's agent was still told it drove a 1280 × 800 window.
   */
  it('tells the next case the size the QA picked, not the one the run began with', async () => {
    const site = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<!doctype html><h1>Shop</h1>');
    });

    await new Promise<void>((ready) => site.listen(PORT, '127.0.0.1', ready));

    const root = await mkdtemp(join(tmpdir(), 'qazinho-resize-'));
    const prompts = join(root, 'prompts');
    const agent = join(root, 'agent');

    await mkdir(prompts);
    // Writes down the system prompt of each turn, and answers nothing.
    await writeFile(
      agent,
      `#!/bin/sh
n=$(ls ${prompts} | wc -l | tr -d ' ')
while [ $# -gt 0 ]; do
  if [ "$1" = "--append-system-prompt" ]; then printf '%s' "$2" > ${prompts}/turn-$n; fi
  shift
done
`,
    );
    await chmod(agent, 0o755);

    const deviceTools = new McpHost();

    await deviceTools.start();

    const coordinator: RunCoordinator = new RunCoordinator({
      runner: new AgentRunner({ owners: new ProcessOwners(), onEvent: () => undefined }),
      findAndroid: async () => null,
      findIos: async () => null,
      findCommand: async () => agent,
      live: new LiveStream(),
      tools: deviceTools,
      harness: new Harness(),
      dataRoot: root,
      onEvent: (event: IRunEvent) => {
        if (event.kind === 'doing' && event.index === 0)
          void coordinator.resize({ workspaceId: 'w-resize', viewport: PHONE });
      },
    });

    const step = (caseId: string) => ({
      caseId,
      caseTitle: 'Shop',
      casePriority: 'P1',
      caseGoal: '',
      casePreconditions: '',
      numberInCase: 1,
      action: 'Look at the page',
      expected: 'It says Shop',
    });

    await coordinator.start({
      workspaceId: 'w-resize',
      agentId: 'fake',
      model: '',
      target: { kind: 'web', value: `http://127.0.0.1:${String(PORT)}/` },
      runId: 'r-01',
      steps: [step('TC-01'), step('TC-02')],
    });

    const turns = (await readdir(prompts)).sort();
    const second = await readFile(join(prompts, turns[1] ?? 'missing'), 'utf8');

    expect(turns).toHaveLength(2);
    expect(second).toContain('390 × 844');
    expect(second).not.toContain('1280 × 800');

    deviceTools.close();
    site.close();
  });
});
