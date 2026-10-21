import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AndroidDriver } from '@/main/classes/devices/AndroidDriver';
import { listAvds } from '@/main/classes/devices/AndroidDriver/library';
import { DeviceToolDetector } from '@/main/classes/devices/DeviceToolDetector';
import { IosDriver } from '@/main/classes/devices/IosDriver';
import { listSimulators } from '@/main/classes/devices/IosDriver/library';
import { buildFixtureApk } from './fixtures/buildFixtureApk';
import { buildFixtureApp } from './fixtures/buildFixtureApp';

/**
 * Every case starts on the app as it was the day it was installed. The fixture apps count the
 * visits they saved, so a case that saved one must hand the next case a counter at zero.
 */
const tools = new DeviceToolDetector().detect();
const sdkRoot = tools.androidSdk.path ?? '';
const idb = tools.idb.path ?? '';
let apk: string | null = null;
let avd: string | undefined;
let app: string | null = null;
let udid: string | undefined;

beforeAll(async () => {
  if (sdkRoot !== '') {
    avd = (await listAvds(sdkRoot))[0];
    apk = avd === undefined ? null : await buildFixtureApk(sdkRoot);
  }

  if (idb !== '') {
    udid = (await listSimulators())[0];
    app = udid === undefined ? null : await buildFixtureApp();
  }
}, 300_000);

async function visits(driver: AndroidDriver | IosDriver): Promise<string> {
  return /Visits: \d+/.exec(await driver.describe())?.[0] ?? '';
}

describe('a fresh start on a real Android emulator', () => {
  let driver: AndroidDriver | null = null;

  afterAll(async () => {
    await driver?.close();
  });

  it('clears what a case saved before the next case starts', async (context) => {
    if (apk === null || avd === undefined) {
      console.log(
        'Android fresh start skipped: no SDK, no AVD, or the fixture did not build.',
      );
      context.skip();

      return;
    }

    driver = new AndroidDriver({ sdkRoot, avd, apk });
    await driver.open();
    expect(await visits(driver)).toBe('Visits: 0');

    await driver.act({ kind: 'click', target: 'Save visit', value: '' });
    expect(await visits(driver)).toBe('Visits: 1');

    await driver.restart();
    expect(await visits(driver)).toBe('Visits: 0');
  }, 600_000);

  it('opens a run on the app as installed, whatever an earlier run saved', async (context) => {
    if (apk === null || avd === undefined || driver === null) {
      context.skip();

      return;
    }

    await driver.act({ kind: 'click', target: 'Save visit', value: '' });
    expect(await visits(driver)).toBe('Visits: 1');

    const next = new AndroidDriver({ sdkRoot, avd, apk });

    await next.open();
    expect(await visits(next)).toBe('Visits: 0');
  }, 600_000);

  it('scrolls until a row far below shows, and holds a finger on a control', async (context) => {
    if (apk === null || avd === undefined || driver === null) {
      context.skip();

      return;
    }

    await driver.restart();
    expect(await driver.describe()).not.toContain('Row 40');

    await driver.act({ kind: 'long_press', target: 'Hold me', value: '' });
    expect(await driver.describe()).toContain('Held long');

    await driver.act({ kind: 'scroll', target: 'Row 40', value: 'down' });
    expect(await driver.describe()).toContain('Row 40');
  }, 600_000);

  /** goto brought the app back as it was and back left it running: neither closed it for real. */
  it('reopens the app for real: a new process, with what it saved kept', async (context) => {
    if (apk === null || avd === undefined || driver === null) {
      context.skip();

      return;
    }

    const pid = () =>
      execFileSync(join(sdkRoot, 'platform-tools', 'adb'), [
        'shell',
        'pidof',
        'app.qazinho.fixture',
      ])
        .toString()
        .trim();

    await driver.restart();
    await driver.act({ kind: 'click', target: 'Save visit', value: '' });

    const before = pid();

    await driver.act({ kind: 'reopen', target: '', value: '' });
    expect(await visits(driver)).toBe('Visits: 1');
    expect(pid()).not.toBe(before);
  }, 600_000);
});

describe('a fresh start on a real iOS simulator', () => {
  let driver: IosDriver | null = null;

  afterAll(async () => {
    await driver?.close();
  });

  it('clears what a case saved before the next case starts', async (context) => {
    if (app === null || udid === undefined) {
      console.log(
        'iOS fresh start skipped: no idb, no simulator, or the fixture did not build.',
      );
      context.skip();

      return;
    }

    driver = new IosDriver({ idb, udid, app });
    await driver.open();
    expect(await visits(driver)).toBe('Visits: 0');

    await driver.act({ kind: 'click', target: 'Save visit', value: '' });
    expect(await visits(driver)).toBe('Visits: 1');

    await driver.restart();
    expect(await visits(driver)).toBe('Visits: 0');
  }, 600_000);

  it('opens a run on the app as installed, whatever an earlier run saved', async (context) => {
    if (app === null || udid === undefined || driver === null) {
      context.skip();

      return;
    }

    await driver.act({ kind: 'click', target: 'Save visit', value: '' });
    expect(await visits(driver)).toBe('Visits: 1');

    const next = new IosDriver({ idb, udid, app });

    await next.open();
    expect(await visits(next)).toBe('Visits: 0');
  }, 600_000);

  it('scrolls until a row far below shows, and holds a finger on a control', async (context) => {
    if (app === null || udid === undefined || driver === null) {
      context.skip();

      return;
    }

    await driver.restart();
    await driver.act({ kind: 'long_press', target: 'Hold me', value: '' });
    expect(await driver.describe()).toContain('Held long');

    await driver.act({ kind: 'scroll', target: 'Row 40', value: 'down' });
    expect(await driver.describe()).toContain('Row 40');
  }, 600_000);

  it('reopens the app with what it saved kept', async (context) => {
    if (app === null || udid === undefined || driver === null) {
      context.skip();

      return;
    }

    await driver.restart();
    await driver.act({ kind: 'click', target: 'Save visit', value: '' });
    await driver.act({ kind: 'reopen', target: '', value: '' });
    expect(await visits(driver)).toBe('Visits: 1');
  }, 600_000);
});
