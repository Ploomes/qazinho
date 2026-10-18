import type { IAppPeek } from './types';
import type { AppLook } from '@/harness';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { WebDriver } from '@/main/classes/devices/WebDriver';
import { stripAnsi } from '@/main/library';
import { APP_PEEK } from './constants';

/** Opens the web app under test for a moment before the chat, so the agent asks about what the app shows. */
export class AppPeek {
  private readonly folder: string;
  private readonly looks = new Map<string, { at: number; look: Promise<AppLook> }>();

  public constructor(props: IAppPeek) {
    this.folder = props.folder;
  }

  /** What the app's page reads, looked at once and kept for a while; a page that did not open is tried again next time. */
  public async look(url: string): Promise<AppLook> {
    const kept = this.looks.get(url);

    if (kept && Date.now() - kept.at < APP_PEEK.keepMs) return kept.look;

    const look = this.open(url).then((seen) => {
      if (!seen.isOpen) this.looks.delete(url);

      return seen;
    });

    this.looks.set(url, { at: Date.now(), look });

    return look;
  }

  private async open(url: string): Promise<AppLook> {
    const profileDir = await mkdtemp(join(this.folder, 'qazinho-look-'));
    const driver = new WebDriver({ url, profileDir });

    try {
      await driver.open();
      await driver.act({ kind: 'wait', target: '', value: String(APP_PEEK.settleMs) });

      return { url, isOpen: true, page: await driver.describe() };
    } catch (reason) {
      const said = stripAnsi(reason instanceof Error ? reason.message : String(reason));

      return { url, isOpen: false, reason: said.split('\n')[0] ?? said };
    } finally {
      await driver.close();
      await rm(profileDir, { recursive: true, force: true });
    }
  }
}
