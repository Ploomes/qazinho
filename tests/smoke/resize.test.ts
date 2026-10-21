import type { IRunEvent } from '@/shared/types';
import { chmod, mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Harness, McpHost } from '@/harness';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { WebDriver } from '@/main/classes/devices/WebDriver';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';

const PORT = 4346;
const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

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
      runner: new AgentRunner({
        owners: new ProcessOwners(),
        folder: tmpdir(),
        onEvent: () => undefined,
      }),
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
      language: 'en',
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

  /**
   * The QA switched a phone run to Desktop: the window grew, but every case after the first
   * opened its fresh tab at the size the run began with, and so did a run resized while Chrome
   * was still starting.
   */
  it('keeps the size picked mid-run through a fresh start, and through a switch made while Chrome starts', async () => {
    const site = createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<!doctype html><h1>Shop</h1>');
    });

    await new Promise<void>((ready) => site.listen(PORT + 1, '127.0.0.1', ready));

    const root = await mkdtemp(join(tmpdir(), 'qazinho-resize-'));
    const sizeOf = async (driver: WebDriver, name: string) => {
      const shot = await driver.shoot(join(root, `${name}.jpg`));
      const bytes = Buffer.from(shot?.dataUrl.split(',')[1] ?? '', 'base64');

      for (let at = 2; at < bytes.length; at += 2 + bytes.readUInt16BE(at + 2))
        if ((bytes[at + 1] ?? 0) >= 0xc0 && (bytes[at + 1] ?? 0) <= 0xc2)
          return {
            width: bytes.readUInt16BE(at + 7),
            height: bytes.readUInt16BE(at + 5),
          };

      return null;
    };

    const later = new WebDriver({
      url: `http://127.0.0.1:${String(PORT + 1)}/`,
      profileDir: join(root, 'later'),
      viewport: PHONE,
    });

    await later.open();

    try {
      await later.resize(DESKTOP);
      expect(await sizeOf(later, 'resized')).toEqual(DESKTOP);

      await later.restart();
      expect(await sizeOf(later, 'restarted')).toEqual(DESKTOP);
    } finally {
      await later.close();
    }

    const early = new WebDriver({
      url: `http://127.0.0.1:${String(PORT + 1)}/`,
      profileDir: join(root, 'early'),
      viewport: PHONE,
    });
    const opening = early.open();

    await early.resize(DESKTOP);
    await opening;

    try {
      expect(await sizeOf(early, 'early')).toEqual(DESKTOP);
    } finally {
      await early.close();
    }

    site.close();
  });
});
