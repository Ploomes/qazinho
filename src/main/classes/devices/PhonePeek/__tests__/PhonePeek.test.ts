import type { IDeviceDriver } from '@/main/classes/devices/types';
import { describe, expect, it } from 'vitest';
import { PhonePeek } from '@/main/classes/devices/PhonePeek';

const TARGET = { kind: 'android' as const, value: '/builds/apps/p-3/visitas.apk' };

/** A phone that opens, reads its screen and closes, writing each move down. */
function phone(props: { fails?: string } = {}) {
  const did: string[] = [];
  const driver: IDeviceDriver = {
    open: () => {
      did.push('open');

      return props.fails === undefined
        ? Promise.resolve()
        : Promise.reject(new Error(`${props.fails}\nat AndroidDriver.boot`));
    },
    restart: () => Promise.resolve(),
    act: (action) => {
      did.push(`act ${action.kind}`);

      return Promise.resolve();
    },
    describe: () => Promise.resolve('APP: app.qazinho.visitas\nTEXT:\nVisitas: 0'),
    glance: () => Promise.resolve(null),
    motion: () => Promise.resolve(null),
    resize: () => Promise.resolve(),
    focus: () => Promise.resolve(),
    shoot: () => Promise.resolve(null),
    stream: () => Promise.resolve(false),
    record: () => Promise.resolve(false),
    stopRecording: () => Promise.resolve(null),
    close: () => {
      did.push('close');

      return Promise.resolve();
    },
  };

  return { driver, did };
}

describe('PhonePeek', () => {
  it('opens the app, reads its first screen, and closes the device again', async () => {
    const { driver, did } = phone();
    const peek = new PhonePeek({
      openDevice: () => Promise.resolve(driver),
      isBusy: () => false,
    });

    expect(await peek.look(TARGET)).toEqual({
      kind: 'android',
      where: 'visitas.apk',
      isOpen: true,
      page: 'APP: app.qazinho.visitas\nTEXT:\nVisitas: 0',
    });
    expect(did).toEqual(['open', 'act wait', 'close']);
  });

  it('keeps what it saw for a while, and opens the device again after', async () => {
    const { driver, did } = phone();
    let now = 0;
    const peek = new PhonePeek({
      openDevice: () => Promise.resolve(driver),
      isBusy: () => false,
      now: () => now,
    });

    expect(peek.isKept(TARGET)).toBe(false);

    await peek.look(TARGET);
    now = 60_000;

    expect(peek.isKept(TARGET)).toBe(true);

    await peek.look(TARGET);

    expect(did.filter((move) => move === 'open')).toHaveLength(1);

    now = 11 * 60_000;
    await peek.look(TARGET);

    expect(did.filter((move) => move === 'open')).toHaveLength(2);
  });

  it('does NOT touch a device a run is using', async () => {
    const { driver, did } = phone();
    const peek = new PhonePeek({
      openDevice: () => Promise.resolve(driver),
      isBusy: (kind) => kind === 'android',
    });

    expect(await peek.look(TARGET)).toEqual({
      kind: 'android',
      where: 'visitas.apk',
      isOpen: false,
      reason: 'a run is using the device now',
    });
    expect(did).toEqual([]);
  });

  it('says what this machine lacks, and why an app did not open, and tries again next time', async () => {
    const missing = new PhonePeek({
      openDevice: () => Promise.resolve(null),
      isBusy: () => false,
    });

    expect(await missing.look({ kind: 'ios', value: '/apps/Visitas.app' })).toMatchObject(
      {
        isOpen: false,
        reason: 'this machine has no iOS simulator with idb',
      },
    );

    const { driver, did } = phone({
      fails: 'The emulator Pixel did not finish booting.',
    });
    const broken = new PhonePeek({
      openDevice: () => Promise.resolve(driver),
      isBusy: () => false,
    });

    expect(await broken.look(TARGET)).toMatchObject({
      isOpen: false,
      reason: 'The emulator Pixel did not finish booting.',
    });
    await broken.look(TARGET);

    expect(did).toEqual(['open', 'close', 'open', 'close']);
  });
});
