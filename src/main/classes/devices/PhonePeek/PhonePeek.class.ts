import type { IPhonePeek, IPhoneTarget } from './types';
import type { AppLook } from '@ploomes/qazinho-harness';
import { basename } from 'node:path';
import { stripAnsi } from '@/main/library';
import { PHONE_PEEK } from './constants';

/**
 * Abre um app de celular no emulador ou simulador antes de o chat planejar, como no dia
 * em que foi instalado, e lê a primeira tela dele.
 */
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

  /**
   * Se uma olhada no app está guardada de um momento atrás, para perguntar de novo não
   * abrir dispositivo nenhum.
   */
  public isKept(target: IPhoneTarget): boolean {
    const kept = this.looks.get(`${target.kind}:${target.value}`);

    return kept !== undefined && this.now() - kept.at < PHONE_PEEK.keepMs;
  }

  /**
   * O que a primeira tela do app lê, olhado uma vez e guardado por um tempo; um app que
   * não abriu é tentado de novo na próxima vez.
   */
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
