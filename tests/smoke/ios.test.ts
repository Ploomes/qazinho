import type { IRunEvent } from '@/shared/types';
import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Harness, McpHost } from '@/harness';
import { AgentDetector } from '@/main/classes/agents/AgentDetector';
import { AgentRunner } from '@/main/classes/agents/AgentRunner';
import { DeviceToolDetector } from '@/main/classes/devices/DeviceToolDetector';
import { IosDriver } from '@/main/classes/devices/IosDriver';
import { listSimulators } from '@/main/classes/devices/IosDriver/library';
import { LiveStream } from '@/main/classes/devices/LiveStream';
import { ProcessOwners } from '@/main/classes/resources/ProcessOwners';
import { RunCoordinator } from '@/main/classes/runs/RunCoordinator';
import { buildFixtureApp } from './fixtures/buildFixtureApp';

/**
 * The visit counter in fixtures/ios, built for the simulator: "Visits: N" and a "Save visit"
 * button. A simulator build is the `.app` folder, never an `.ipa`.
 */
const tools = new DeviceToolDetector().detect();
const idb = tools.idb.path ?? '';
const hasIdb = tools.idb.isFound;

let app: string | null = null;
let udid: string | undefined;
let driver: IosDriver | null = null;
let shotDir: string;

beforeAll(async () => {
  if (!hasIdb) return;

  udid = (await listSimulators())[0];

  if (udid === undefined) throw new Error('No iPhone simulator on this machine.');

  app = await buildFixtureApp();

  if (app === null) throw new Error('The fixture app did not build: is Xcode installed?');

  shotDir = await mkdtemp(join(tmpdir(), 'qazinho-ios-'));
  driver = new IosDriver({ idb, udid, app });

  await driver.open();
}, 300_000);

afterAll(async () => {
  await driver?.close();
});

describe.skipIf(!hasIdb)(
  'a real iOS simulator',
  () => {
    it('installs the build and brings it to the front', async () => {
      expect(await driver?.describe()).toContain('APP: app.qazinho.fixture');
    });

    it('reads the screen the way a person does', async () => {
      const screen = (await driver?.describe()) ?? '';

      expect(screen).toContain('TEXT:');
      expect(screen).toContain('Visits: 0');
      expect(screen).toContain('button: Save visit');
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
  },
  300_000,
);

describe.skipIf(!hasIdb)('a real run on a simulator', () => {
  it('walks a plan on the simulator with the QA own agent', async () => {
    const events: IRunEvent[] = [];
    const deviceTools = new McpHost();

    await deviceTools.start();

    const coordinator = new RunCoordinator({
      runner: new AgentRunner({ owners: new ProcessOwners(), onEvent: () => undefined }),
      findAndroid: async () => null,
      findIos: async () => (udid === undefined ? null : { idb, udid }),
      findCommand: async (id) =>
        (await new AgentDetector().detect()).find((one) => one.id === id)?.path ?? null,
      live: new LiveStream(),
      tools: deviceTools,
      harness: new Harness(),
      dataRoot: await mkdtemp(join(tmpdir(), 'qazinho-ios-run-')),
      onEvent: (event) => events.push(event),
    });

    await coordinator.start({
      workspaceId: 'w-ios',
      agentId: 'claude-code',
      model: 'haiku',
      target: { kind: 'ios', value: app ?? '' },
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

describe.skipIf(hasIdb)('an iOS smoke with nothing to drive', () => {
  it('says what is missing instead of passing quietly', () => {
    console.log('iOS smoke skipped: idb missing (brew install idb-companion).');

    expect(hasIdb).toBe(false);
  });
});
