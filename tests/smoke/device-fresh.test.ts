import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DeviceToolDetector } from '@/main/classes/devices/DeviceToolDetector';
import {
  AndroidDriver,
  listAvds,
  IosDriver,
  listSimulators,
} from '@salve-software/qazinho-harness/engine';
import { buildFixtureApk } from './fixtures/buildFixtureApk';
import { buildFixtureApp } from './fixtures/buildFixtureApp';

/**
 * Todo caso começa com o app como estava no dia em que foi instalado. Os apps de fixture
 * contam as visitas que salvaram, então um caso que salvou uma precisa entregar ao
 * próximo um contador em zero.
 */
const tools = new DeviceToolDetector().detect();
const sdkRoot = tools.androidSdk.path ?? '';
const axe = tools.axe.path ?? '';
let apk: string | null = null;
let avd: string | undefined;
let app: string | null = null;
let udid: string | undefined;

beforeAll(async () => {
  if (sdkRoot !== '') {
    avd = (await listAvds(sdkRoot))[0];
    apk = avd === undefined ? null : await buildFixtureApk(sdkRoot);
  }

  if (axe !== '') {
    udid = (await listSimulators())[0];
    app = udid === undefined ? null : await buildFixtureApp();
  }
}, 300_000);

/** Uma senha com todo caractere que um shell ou um teclado poderia errar. */
const TYPED = 'P@ss $& (x) "q" \'a\' ;b|c<d>e*f?g[h]{i}~#!';

/**
 * O mesmo para o Android, cujo adb não digita aspas duplas, com um %s que o input text
 * leria como espaço.
 */
const ANDROID_TYPED = "P@ss $& (x) 'a' ;b|c<d>e*f?g[h]{i}~#! 50%s off";

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

  it('types a value character for character, whatever the shell would read', async (context) => {
    if (apk === null || avd === undefined || driver === null) {
      context.skip();

      return;
    }

    await driver.restart();
    await driver.act({ kind: 'fill', target: 'Note', value: ANDROID_TYPED });
    expect(await driver.describe()).toContain(ANDROID_TYPED);
  }, 600_000);

  it('says plainly that it cannot type a double quote, and types nothing', async (context) => {
    if (apk === null || avd === undefined || driver === null) {
      context.skip();

      return;
    }

    await driver.restart();
    await expect(
      driver.act({ kind: 'fill', target: 'Note', value: 'say "hi"' }),
    ).rejects.toThrow('Android cannot type a double quote');
    expect(await driver.describe()).toContain('edittext: Note');
  }, 600_000);

  /**
   * O goto trazia o app de volta como estava e o back o deixava rodando: nenhum dos dois
   * o fechava de verdade.
   */
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
        'iOS fresh start skipped: no AXe, no simulator, or the fixture did not build.',
      );
      context.skip();

      return;
    }

    driver = new IosDriver({ axe, udid, app });
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

    const next = new IosDriver({ axe, udid, app });

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

  it('types a value character for character', async (context) => {
    if (app === null || udid === undefined || driver === null) {
      context.skip();

      return;
    }

    await driver.restart();
    await driver.act({ kind: 'fill', target: 'Note', value: TYPED });
    expect(await driver.describe()).toContain(`Noted: ${TYPED}`);
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
