import type { IWebDriver } from './types';
import type { IDeviceDriver, IShot } from '@/main/classes/devices/types';
import type { IActionMotion, IDeviceImage, IStepAction } from '@/shared/types';
import type { BrowserContext, CDPSession, Page } from 'playwright-core';
import { chromium } from 'playwright-core';
import { MOTION_PROBE, WEB_DRIVER } from './constants';
import { describePage, findLocator, summarizeMotion } from './library';

/** Drives a real Chrome on this machine with no window of its own; the QA watches it in the device panel. */
export class WebDriver implements IDeviceDriver {
  private readonly url: string;
  private readonly profileDir: string;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private screencast: CDPSession | null = null;
  private glancer: CDPSession | null = null;
  private lastMotion: IActionMotion | null = null;

  public constructor(props: IWebDriver) {
    this.url = props.url;
    this.profileDir = props.profileDir;
  }

  public async open(): Promise<void> {
    this.context = await chromium.launchPersistentContext(this.profileDir, {
      channel: 'chrome',
      headless: true,
      viewport: { ...WEB_DRIVER.viewport },
    });
    await this.context.addInitScript(MOTION_PROBE);
    this.page = this.context.pages()[0] ?? (await this.context.newPage());

    await this.page.goto(this.url, { timeout: WEB_DRIVER.gotoTimeoutMs });
  }

  /** Carries one action out, and keeps how the page moved while it ran for `motion` to hand over. */
  public async act(action: IStepAction): Promise<void> {
    const page = this.page;

    if (!page) throw new Error('The browser is not open.');

    this.lastMotion = null;

    const before = await this.markOf(page);

    await this.perform({ page, action });

    const acted = await this.markOf(page);

    if (action.kind === 'goto' || action.kind === 'press' || action.kind === 'click')
      await this.settle(page);

    if (action.kind !== 'wait' && acted !== null)
      await this.waitForQuiet({ page, from: acted });

    const after = await this.markOf(page);

    this.lastMotion = await this.motionSince({
      page,
      since: after?.origin === before?.origin ? (before?.at ?? 0) : 0,
    });
  }

  /** How the page moved during the last action, handed over once. */
  public async motion(): Promise<IActionMotion | null> {
    const motion = this.lastMotion;

    this.lastMotion = null;

    return motion;
  }

  /** The visible part of the page, scaled down, as the agent reads it. */
  public async glance(): Promise<IDeviceImage | null> {
    if (!this.context || !this.page) return null;

    this.glancer ??= await this.context.newCDPSession(this.page);

    const [x, y] = await this.page.evaluate<[number, number]>(
      '[window.scrollX, window.scrollY]',
    );
    const shot = await this.glancer.send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: WEB_DRIVER.glanceQuality,
      clip: { x, y, ...WEB_DRIVER.viewport, scale: WEB_DRIVER.glanceScale },
    });

    return { data: shot.data, mimeType: 'image/jpeg' };
  }

  public async describe(): Promise<string> {
    return this.page ? describePage(this.page) : '';
  }

  public async shoot(file: string): Promise<IShot | null> {
    if (!this.page) return null;

    const image = await this.page.screenshot({ path: file, type: 'jpeg', quality: 70 });

    return { file, dataUrl: `data:image/jpeg;base64,${image.toString('base64')}` };
  }

  public async stream(onFrame: (jpeg: Buffer) => void): Promise<boolean> {
    if (!this.context || !this.page) return false;

    const session = await this.context.newCDPSession(this.page);

    session.on('Page.screencastFrame', (frame) => {
      onFrame(Buffer.from(frame.data, 'base64'));
      void session
        .send('Page.screencastFrameAck', { sessionId: frame.sessionId })
        .catch(() => undefined);
    });

    await session.send('Page.startScreencast', {
      format: 'jpeg',
      quality: WEB_DRIVER.streamQuality,
      maxWidth: WEB_DRIVER.viewport.width,
      maxHeight: WEB_DRIVER.viewport.height,
    });

    this.screencast = session;

    return true;
  }

  public async close(): Promise<void> {
    await this.screencast?.detach().catch(() => undefined);
    await this.glancer?.detach().catch(() => undefined);
    this.screencast = null;
    this.glancer = null;
    await this.context?.close().catch(() => undefined);
    this.context = null;
    this.page = null;
  }

  private async perform(props: { page: Page; action: IStepAction }): Promise<void> {
    const { page, action } = props;

    if (action.kind === 'goto') {
      await page.goto(action.target, { timeout: WEB_DRIVER.gotoTimeoutMs });

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

  private async markOf(page: Page): Promise<{ origin: number; at: number } | null> {
    return page
      .evaluate<{ origin: number; at: number }>(
        '({ origin: performance.timeOrigin, at: performance.now() })',
      )
      .catch(() => null);
  }

  private async waitForQuiet(props: {
    page: Page;
    from: { origin: number; at: number };
  }): Promise<void> {
    const { page, from } = props;
    const until = Date.now() + WEB_DRIVER.quietCapMs;
    const idle = `performance.now() - Math.max(window.__qazinho?.lastChange ?? 0, performance.timeOrigin === ${String(from.origin)} ? ${String(from.at)} : 0)`;

    while (Date.now() < until) {
      const idleMs = await page.evaluate<number>(idle).catch(() => Infinity);

      if (idleMs >= WEB_DRIVER.quietMs) return;

      await page.waitForTimeout(WEB_DRIVER.quietPollMs);
    }
  }

  private async motionSince(props: {
    page: Page;
    since: number;
  }): Promise<IActionMotion | null> {
    const probed = await props.page
      .evaluate<{
        shifts: { at: number; value: number; hadInput: boolean }[];
        frames: { at: number; ms: number }[];
      } | null>(
        'window.__qazinho ? { shifts: window.__qazinho.shifts, frames: window.__qazinho.frames } : null',
      )
      .catch(() => null);

    if (!probed) return null;

    return summarizeMotion({
      shifts: probed.shifts.filter(({ at }) => at >= props.since),
      frames: probed.frames.filter(({ at }) => at >= props.since),
    });
  }

  /** Waits for what an action started to finish, so the page the agent reads next is the new one. */
  private async settle(page: Page): Promise<void> {
    await page
      .waitForLoadState('networkidle', { timeout: WEB_DRIVER.settleMs })
      .catch(() => undefined);
  }
}
