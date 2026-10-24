import type { IPhonePeek, IPhoneTarget } from './types';
import type { AppLook } from '@salve-software/qazinho-harness';
import { basename } from 'node:path';
import { stripAnsi } from '@/main/library';
import { PHONE_PEEK } from './constants';

/** Opens a phone app on the emulator or simulator before the chat plans, as on the day it was installed, and reads its first screen. */
export class PhonePeek {
  private readonly openDevice: IPhonePeek['openDevice'];
  private readonly isBusy: IPhonePeek['isBusy'];
  private readonly now: () => number;
  private readonly looks = new Map<string, { at: number; look: Promise<AppLook> }>();

  public constructor(props: IPhonePeek) {
    this.openDevice = props.openDevice;
    this.isBusy = props.isBusy;
    this.now = props.now ?? Date.now;
  }

  /** Whether a look at the app is kept from a moment ago, so asking again opens no device. */
  public isKept(target: IPhoneTarget): boolean {
    const kept = this.looks.get(`${target.kind}:${target.value}`);

    return kept !== undefined && this.now() - kept.at < PHONE_PEEK.keepMs;
  }

  /** What the app's first screen reads, looked at once and kept for a while; an app that did not open is tried again next time. */
  public async look(target: IPhoneTarget): Promise<AppLook> {
    const key = `${target.kind}:${target.value}`;
    const kept = this.looks.get(key);

    if (kept && this.now() - kept.at < PHONE_PEEK.keepMs) return kept.look;

    const look = this.open(target).then((seen) => {
      if (!seen.isOpen) this.looks.delete(key);

      return seen;
    });

    this.looks.set(key, { at: this.now(), look });

    return look;
  }

  private async open(target: IPhoneTarget): Promise<AppLook> {
    const where = basename(target.value);
    const shut = (reason: string): AppLook => ({
      kind: target.kind,
      where,
      isOpen: false,
      reason,
    });

    if (this.isBusy(target.kind)) return shut(PHONE_PEEK.reasons.busy);

    const driver = await this.openDevice(target);

    if (driver === null) return shut(PHONE_PEEK.reasons[target.kind]);

    try {
      await driver.open();
      await driver.act({ kind: 'wait', target: '', value: String(PHONE_PEEK.settleMs) });

      return { kind: target.kind, where, isOpen: true, page: await driver.describe() };
    } catch (reason) {
      const said = stripAnsi(reason instanceof Error ? reason.message : String(reason));

      return shut(said.split('\n')[0] ?? said);
    } finally {
      await driver.close().catch(() => undefined);
    }
  }
}
