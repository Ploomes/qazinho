import type { IRunEvent } from '@/types';
import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { DeviceToolServer } from '@/main/classes/agents/DeviceToolServer';
import { Harness } from '@/main/classes/agents/Harness';
import { AndroidDriver } from '@/main/classes/devices/AndroidDriver';
import { listAvds } from '@/main/classes/devices/AndroidDriver/library';
import { DeviceToolDetector } from '@/main/classes/devices/DeviceToolDetector';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';

/** A real apk on disk. Pull one off the emulator with `adb pull $(adb shell pm path <pkg>)`. */
const APK = process.env.GOCRASH_SMOKE_APK ?? '/tmp/demo.apk';

let driver: AndroidDriver;
let shotDir: string;

beforeAll(async () => {
  const sdkRoot = new DeviceToolDetector().detect().androidSdk.path;

  if (sdkRoot === null) throw new Error('No Android SDK on this machine.');

  const avd = (await listAvds(sdkRoot))[0];

  if (avd === undefined) throw new Error('No AVD on this machine.');

  shotDir = await mkdtemp(join(tmpdir(), 'gocrash-android-'));
  driver = new AndroidDriver({ sdkRoot, avd, apk: APK });

  await driver.open();
}, 300_000);

afterAll(async () => {
  await driver.close();
});

describe('a real Android emulator', () => {
  it('installs the apk and brings it to the front', async () => {
    expect(await driver.describe()).toContain('APP: com.callstack.expodemo');
  });

  it('reads the screen the way a person does', async () => {
    const screen = await driver.describe();

    console.log(screen.slice(0, 700));

    expect(screen).toContain('TEXT:');
    expect(screen).toContain('CONTROLS:');
    expect(screen.length).toBeGreaterThan(40);
  });

  it('takes a screenshot the page can draw', async () => {
    const shot = await driver.shoot(join(shotDir, 'step-1.png'));

    expect(shot?.dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect((await stat(shot?.file ?? '')).size).toBeGreaterThan(5_000);
  });

  it('refuses a target that is not on the screen, instead of tapping nowhere', async () => {
    await expect(
      driver.act({ kind: 'click', target: 'a button that does not exist', value: '' }),
    ).rejects.toThrow('answers to');
  });

  it('presses a key the phone understands', async () => {
    await driver.act({ kind: 'press', target: 'back', value: '' });

    expect(await driver.describe()).toContain('APP:');
  });
}, 300_000);

describe('a real run on a phone', () => {
  it('walks a plan on the emulator with the QA own agent', async () => {
    const owners = new ProcessOwners();
    const events: IRunEvent[] = [];
    const tools = new DeviceToolDetector().detect();
    const sdkRoot = tools.androidSdk.path ?? '';

    const deviceTools = new DeviceToolServer();

    await deviceTools.start();

    const coordinator = new RunCoordinator({
      runner: new AgentRunner({ owners, onEvent: () => undefined }),
      findIos: async () => null,
      findCommand: async (id) =>
        (await new AgentDetector().detect()).find((one) => one.id === id)?.path ?? null,
      findAndroid: async () => ({ sdkRoot, avd: (await listAvds(sdkRoot))[0] ?? '' }),
      live: new LiveStream(),
      tools: deviceTools,
      harness: new Harness(),
      dataRoot: await mkdtemp(join(tmpdir(), 'gocrash-android-run-')),
      onEvent: (event) => events.push(event),
    });

    await coordinator.start({
      workspaceId: 'w-android',
      agentId: 'claude-code',
      model: 'sonnet',
      sessionId: null,
      target: { kind: 'android', value: APK },
      runId: 'r-01',
      steps: [
        {
          caseId: 'TC-01',
          caseTitle: 'The demo app opens',
          numberInCase: 1,
          action: 'Tap the Settings tab at the bottom of the screen',
          expected: 'A settings screen opens',
        },
        {
          caseId: 'TC-02',
          caseTitle: 'Something that is not there',
          numberInCase: 1,
          action: 'Read the shopping cart total on the screen',
          expected: 'The screen shows a cart total in dollars',
        },
      ],
    });

    for (const event of events)
      console.log(
        event.kind === 'step'
          ? `step ${String(event.outcome.index)} ${event.outcome.verdict} · title="${event.outcome.title}" · got=${event.outcome.got} · shot=${String(event.outcome.screenshot?.length ?? 0)} bytes`
          : JSON.stringify(event),
      );

    expect(events.at(-1)?.kind).toBe('done');
    expect(events.filter((event) => event.kind === 'step')).toHaveLength(2);
  }, 600_000);
});
