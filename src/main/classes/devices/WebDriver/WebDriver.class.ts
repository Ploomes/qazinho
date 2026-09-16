import type { IShot } from './types';
import type { IStepAction } from '@/types';
import type { Browser, Page } from 'playwright-core';
import { chromium } from 'playwright-core';
import { WEB_DRIVER } from './constants';
import { describePage, findLocator } from './library';

/** Drives a real browser on this machine. The QA watches it work. */
export class WebDriver {
  private browser: Browser | null = null;
  private page: Page | null = null;

  public async open(url: string): Promise<void> {
    this.browser = await chromium.launch({ channel: 'chrome', headless: false });
    this.page = await this.browser.newPage({ viewport: { ...WEB_DRIVER.viewport } });

    await this.page.goto(url, { timeout: WEB_DRIVER.actionTimeoutMs });
  }

  public async act(action: IStepAction): Promise<void> {
    const page = this.page;

    if (!page) throw new Error('The browser is not open.');

    if (action.kind === 'goto') {
      await page.goto(action.target, { timeout: WEB_DRIVER.actionTimeoutMs });

      return;
    }

    if (action.kind === 'press') {
      await page.keyboard.press(action.target.length > 0 ? action.target : 'Enter');

      return;
    }

    if (action.kind === 'wait') {
      await page.waitForTimeout(Number(action.value) || WEB_DRIVER.waitMs);

      return;
    }

    const locator = await findLocator({ page, target: action.target });

    if (!locator) throw new Error(`Nothing on the page answers to "${action.target}".`);

    if (action.kind === 'fill')
      await locator.fill(action.value, { timeout: WEB_DRIVER.actionTimeoutMs });
    else await locator.click({ timeout: WEB_DRIVER.actionTimeoutMs });
  }

  public async describe(): Promise<string> {
    return this.page ? describePage(this.page) : '';
  }

  public async shoot(file: string): Promise<IShot | null> {
    if (!this.page) return null;

    const image = await this.page.screenshot({ path: file, type: 'jpeg', quality: 70 });

    return { file, dataUrl: `data:image/jpeg;base64,${image.toString('base64')}` };
  }

  public async close(): Promise<void> {
    await this.browser?.close().catch(() => undefined);
    this.browser = null;
    this.page = null;
  }
}
