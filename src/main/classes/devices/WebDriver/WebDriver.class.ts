import type { IWebDriver } from './types';
import type { IDeviceDriver, IShot } from '@/main/classes/devices/types';
import type { IStepAction } from '@/types';
import type { BrowserContext, Page } from 'playwright-core';
import { chromium } from 'playwright-core';
import { WEB_DRIVER } from './constants';
import { describePage, findLocator } from './library';

/** Drives a real browser on this machine. The QA watches it work. */
export class WebDriver implements IDeviceDriver {
  private readonly url: string;
  private readonly profileDir: string;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  public constructor(props: IWebDriver) {
    this.url = props.url;
    this.profileDir = props.profileDir;
  }

  public async open(): Promise<void> {
    this.context = await chromium.launchPersistentContext(this.profileDir, {
      channel: 'chrome',
      headless: false,
      viewport: { ...WEB_DRIVER.viewport },
    });
    this.page = this.context.pages()[0] ?? (await this.context.newPage());

    await this.page.goto(this.url, { timeout: WEB_DRIVER.actionTimeoutMs });
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
    await this.context?.close().catch(() => undefined);
    this.context = null;
    this.page = null;
  }
}
