import { mkdtemp, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DeviceToolDetector } from '@/main/classes/devices/DeviceToolDetector';
import { IosDriver } from '@/main/classes/devices/IosDriver';
import { listSimulators } from '@/main/classes/devices/IosDriver/library';

/** A simulator build on disk: the `.app` folder out of DerivedData, never an `.ipa`. */
const APP = process.env.GOCRASH_SMOKE_APP ?? '';

const tools = new DeviceToolDetector().detect();
const hasIdb = tools.idb.isFound && APP.length > 0;

let driver: IosDriver;
let shotDir: string;

beforeAll(async () => {
  if (!hasIdb) return;

  const udid = (await listSimulators())[0];

  if (udid === undefined) throw new Error('No iPhone simulator on this machine.');

  shotDir = await mkdtemp(join(tmpdir(), 'gocrash-ios-'));
  driver = new IosDriver({ idb: tools.idb.path ?? '', udid, app: APP });

  await driver.open();
}, 300_000);

afterAll(async () => {
  if (hasIdb) await driver.close();
});

describe.skipIf(!hasIdb)(
  'a real iOS simulator',
  () => {
    it('installs the build and brings it to the front', async () => {
      expect(await driver.describe()).toContain('APP: ');
    });

    it('reads the screen the way a person does', async () => {
      const screen = await driver.describe();

      console.log(screen.slice(0, 700));

      expect(screen).toContain('TEXT:');
      expect(screen).toContain('CONTROLS:');
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
  },
  300_000,
);

describe.skipIf(hasIdb)('an iOS smoke with nothing to drive', () => {
  it('says what is missing instead of passing quietly', () => {
    console.log(
      `iOS smoke skipped: idb ${tools.idb.isFound ? 'found' : 'missing (brew install idb-companion)'}, GOCRASH_SMOKE_APP ${APP.length > 0 ? 'set' : 'unset'}.`,
    );

    expect(hasIdb).toBe(false);
  });
});
