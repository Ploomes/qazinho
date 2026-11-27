import type { IRunEvent } from '@/shared/types';
import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { DeviceToolDetector } from '@/main/classes/devices/DeviceToolDetector';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';
import { Harness, McpHost } from '@ploomes/qazinho-harness';
import { listAvds, AndroidDriver } from '@ploomes/qazinho-harness/engine';
import { buildFixtureApk } from './fixtures/buildFixtureApk';

/**
 * O contador de visitas em fixtures/android, construído do fonte: "Visits: N" e um botão
 * "Save visit".
 */
const sdkRoot = new DeviceToolDetector().detect().androidSdk.path ?? '';

let apk = '';
let avd = '';
let driver: AndroidDriver | null = null;
let shotDir: string;

beforeAll(async () => {
  if (sdkRoot === '') throw new Error('No Android SDK on this machine.');

  avd = (await listAvds(sdkRoot))[0] ?? '';

  if (avd === '') throw new Error('No AVD on this machine.');

  apk = (await buildFixtureApk(sdkRoot)) ?? '';

  if (apk === '') throw new Error('The fixture apk did not build: is a JDK installed?');

  shotDir = await mkdtemp(join(tmpdir(), 'qazinho-android-'));
  driver = new AndroidDriver({ sdkRoot, avd, apk });

  await driver.open();
}, 300_000);

afterAll(async () => {
  await driver?.close();
});

describe('a real Android emulator', () => {
  it('installs the apk and brings it to the front', async () => {
    expect(await driver?.describe()).toContain('APP: app.qazinho.fixture');
  });

  it('reads the screen the way a person does', async () => {
    const screen = (await driver?.describe()) ?? '';

    expect(screen).toContain('TEXT:');
    expect(screen).toContain('Visits: 0');
    expect(screen).toMatch(/button: save visit/i);
  });

  it('taps what the agent names, and the app answers', async () => {
    await driver?.act({ kind: 'click', target: 'Save visit', value: '' });

    expect(await driver?.describe()).toContain('Visits: 1');
  });

  it('takes a screenshot the page can draw', async () => {
    const shot = await driver?.shoot(join(shotDir, 'step-1.png'));

    expect(shot?.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect((await stat(shot?.file ?? '')).size).toBeGreaterThan(5_000);
  });

  it('refuses a target that is not on the screen, instead of tapping nowhere', async () => {
    await expect(
      driver?.act({ kind: 'click', target: 'a button that does not exist', value: '' }),
    ).rejects.toThrow('answers to');
  });

  it('presses a key the phone understands', async () => {
    await driver?.act({ kind: 'press', target: 'back', value: '' });

    expect(await driver?.describe()).toContain('APP:');
  });
}, 300_000);

describe('a real run on a phone', () => {
  it('walks a plan on the emulator with the QA own agent', async () => {
    const events: IRunEvent[] = [];
    const deviceTools = new McpHost();

    await deviceTools.start();

    const coordinator = new RunCoordinator({
      runner: new AgentRunner({
        owners: new ProcessOwners(),
        folder: tmpdir(),
        onEvent: () => undefined,
      }),
      findIos: async () => null,
      findCommand: async (id) =>
        (await new AgentDetector().detect()).find((one) => one.id === id)?.path ?? null,
      findAndroid: async () => ({ sdkRoot, avd }),
      live: new LiveStream(),
      tools: deviceTools,
      harness: new Harness(),
      dataRoot: await mkdtemp(join(tmpdir(), 'qazinho-android-run-')),
      onEvent: (event) => events.push(event),
    });

    await coordinator.start({
      workspaceId: 'w-android',
      agentId: 'claude-code',
      model: 'haiku',
      target: { kind: 'android', value: apk },
      runId: 'r-01',
      language: 'en',
      steps: [
        {
          caseId: 'TC-01',
          caseTitle: 'A visit is saved',
          casePriority: 'P1',
          caseGoal: 'Saving a visit counts it.',
          casePreconditions: '',
          numberInCase: 1,
          action: 'Tap Save visit',
          expected: 'The screen shows Visits: 1',
        },
        {
          caseId: 'TC-02',
          caseTitle: 'Something that is not there',
          casePriority: 'P2',
          caseGoal: '',
          casePreconditions: '',
          numberInCase: 1,
          action: 'Read the shopping cart total on the screen',
          expected: 'The screen shows a cart total in dollars',
        },
      ],
    });

    const steps = events.flatMap((event) =>
      event.kind === 'step' ? [event.outcome] : [],
    );

    for (const step of steps)
      console.log(`step ${String(step.index)} ${step.verdict} · got=${step.got}`);

    expect(events.at(-1)?.kind).toBe('done');
    expect(steps.map(({ verdict }) => verdict)).toEqual(['passed', 'failed']);
  }, 600_000);
});
