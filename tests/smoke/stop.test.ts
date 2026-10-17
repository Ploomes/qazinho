import type { IRunEvent } from '@/types';
import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { DeviceToolServer } from '@/main/classes/agents/DeviceToolServer';
import { Harness } from '@/main/classes/agents/Harness';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';

const THINKING_SEC = 120;
const STOP_AFTER_MS = 3_000;
const STOPPED_WITHIN_MS = 5_000;

describe('stopping a run', () => {
  it('ends the run while the agent is still thinking, with no verdict filed', async () => {
    const site = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<!doctype html><h1>Shop</h1>');
    });

    await new Promise<void>((ready) => site.listen(4324, '127.0.0.1', ready));

    const root = await mkdtemp(join(tmpdir(), 'qazinho-stop-'));
    const agent = join(root, 'slow-agent');

    await writeFile(agent, `#!/bin/sh\nsleep ${String(THINKING_SEC)}\n`);
    await chmod(agent, 0o755);

    const events: IRunEvent[] = [];
    const deviceTools = new DeviceToolServer();

    await deviceTools.start();

    const coordinator = new RunCoordinator({
      runner: new AgentRunner({ owners: new ProcessOwners(), onEvent: () => undefined }),
      findAndroid: async () => null,
      findIos: async () => null,
      findCommand: async () => agent,
      live: new LiveStream(),
      tools: deviceTools,
      harness: new Harness(),
      dataRoot: root,
      onEvent: (event) => events.push(event),
    });

    const began = Date.now();
    const walking = coordinator.start({
      workspaceId: 'w-stop',
      agentId: 'slow',
      model: '',
      target: { kind: 'web', value: 'http://127.0.0.1:4324/' },
      runId: 'r-01',
      steps: [
        {
          caseId: 'TC-01',
          caseTitle: 'Shop',
          numberInCase: 1,
          action: 'Look at the page',
          expected: 'It says Shop',
        },
      ],
    });

    await new Promise((wake) => setTimeout(wake, STOP_AFTER_MS));
    coordinator.stop('w-stop');
    await walking;

    expect(Date.now() - began).toBeLessThan(STOP_AFTER_MS + STOPPED_WITHIN_MS);
    expect(events.some((event) => event.kind === 'step')).toBe(false);
    expect(events.at(-1)).toEqual({ kind: 'done', workspaceId: 'w-stop' });

    site.close();
  });
});
