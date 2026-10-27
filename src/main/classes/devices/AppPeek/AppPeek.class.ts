import type { IAppPeek } from './types';
import type { AppLook } from '@salve-software/qazinho-harness';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { stripAnsi } from '@/main/library';
import { WebDriver } from '@salve-software/qazinho-harness/engine';
import { APP_PEEK } from './constants';

/** Opens the web app under test and the pages its menu leads to, before the chat, so the agent asks about what is there. */
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

      const pages = [await driver.describe()];

      for (const link of (await driver.navigation()).slice(0, APP_PEEK.menuPages)) {
        const isOpen = await driver.act({ kind: 'goto', target: link, value: '' }).then(
          () => true,
          () => false,
        );

        if (isOpen)
          pages.push((await driver.describe()).slice(0, APP_PEEK.menuPageChars));
      }

      return { kind: 'web', where: url, isOpen: true, page: pages.join('\n\n') };
    } catch (reason) {
      const said = stripAnsi(reason instanceof Error ? reason.message : String(reason));

      return {
        kind: 'web',
        where: url,
        isOpen: false,
        reason: said.split('\n')[0] ?? said,
      };
    } finally {
      await driver.close();
      await rm(profileDir, { recursive: true, force: true, maxRetries: 5 });
    }
  }
}
