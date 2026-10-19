import type { IWebDriver } from './types';
import type { IDeviceDriver, IShot } from '@/main/classes/devices/types';
import type { ShrinkImage } from '@/main/types';
import type {
  DialogAnswer,
  IActionMotion,
  IDeviceImage,
  IStepAction,
  IViewport,
} from '@/shared/types';
import type { BrowserContext, CDPSession, Page } from 'playwright-core';
import { rm } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { FIELD_FORMATS, MOTION_PROBE, WEB_DRIVER } from './constants';
import {
  describePage,
  findLocator,
  optionOf,
  originOf,
  pagesOf,
  summarizeMotion,
} from './library';

/** Drives a real Chrome on this machine with no window of its own; the QA watches it in the device panel. */
export class WebDriver implements IDeviceDriver {
  private readonly url: string;
  private readonly profileDir: string;
  private readonly pixelRatio: number;
  private readonly shrink: ShrinkImage | null;
  private readonly origins = new Set<string>();
  private readonly dialogs: string[] = [];
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private screencast: CDPSession | null = null;
  private cdp: CDPSession | null = null;
  private onFrame: ((jpeg: Buffer) => void) | null = null;
  private lastMotion: IActionMotion | null = null;
  private viewport: IViewport;
  private isFocused = false;
  private dialogAnswer: DialogAnswer = 'ok';
  private promptText: string | null = null;

  public constructor(props: IWebDriver) {
    this.url = props.url;
    this.profileDir = props.profileDir;
    this.viewport = props.viewport ?? WEB_DRIVER.viewport;
    this.pixelRatio = Math.min(
      Math.max(props.pixelRatio ?? 1, 1),
      WEB_DRIVER.maxPixelRatio,
    );
    this.shrink = props.shrink ?? null;
  }

  /** Opens Chrome on an empty profile, so a run never starts with what an earlier one saved. */
  public async open(): Promise<void> {
    await rm(this.profileDir, { recursive: true, force: true });
    this.context = await chromium.launchPersistentContext(this.profileDir, {
      channel: 'chrome',
      headless: true,
      viewport: { ...this.viewport },
      deviceScaleFactor: this.pixelRatio,
      args: [`--force-device-scale-factor=${String(this.pixelRatio)}`],
    });
    await this.context.addInitScript(MOTION_PROBE);
    this.context.on('page', (page) => {
      this.follow(page);
      void this.adopt(page);
    });
    this.page = this.context.pages()[0] ?? (await this.context.newPage());
    this.follow(this.page);

    await this.page.setViewportSize(this.viewport);
    await this.fit();
    await this.page.goto(this.url, { timeout: WEB_DRIVER.gotoTimeoutMs });
  }

  /** Starts the app over for someone who never opened it: no cookie, nothing stored, one new tab on its address. */
  public async restart(): Promise<void> {
    const context = this.context;

    if (!context) throw new Error('The browser is not open.');

    await this.screencast?.detach().catch(() => undefined);
    await this.cdp?.detach().catch(() => undefined);
    this.screencast = null;
    this.cdp = null;
    this.lastMotion = null;

    const page = await context.newPage();

    for (const stale of context.pages())
      if (stale !== page) await stale.close().catch(() => undefined);

    this.page = page;
    await page.setViewportSize(this.viewport);
    await context.clearCookies();
    await context.clearPermissions();

    const cdp = await this.session();

    for (const origin of this.origins)
      await cdp
        ?.send('Storage.clearDataForOrigin', { origin, storageTypes: 'all' })
        .catch(() => undefined);

    await this.fit();

    if (this.onFrame) await this.watch(this.onFrame);

    await page.goto(this.url, { timeout: WEB_DRIVER.gotoTimeoutMs });
  }

  /** Carries one action out, answering the dialogs it opens the way it says, and keeps how the page moved for `motion`. */
  public async act(action: IStepAction): Promise<void> {
    const page = this.page;

    if (!page) throw new Error('The browser is not open.');

    this.lastMotion = null;
    this.dialogAnswer = action.dialog ?? 'ok';
    this.promptText = action.promptText ?? null;

    try {
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
    } finally {
      this.dialogAnswer = 'ok';
      this.promptText = null;
    }
  }

  /** How the page moved during the last action, handed over once. */
  public async motion(): Promise<IActionMotion | null> {
    const motion = this.lastMotion;

    this.lastMotion = null;

    return motion;
  }

  /** The visible part of the page, scaled down, as the agent reads it: shot whole and shrunk, since Chrome drawing it small drops 1px borders. */
  public async glance(): Promise<IDeviceImage | null> {
    const cdp = await this.session();

    if (!cdp || !this.page) return null;

    const [x, y] = await this.page.evaluate<[number, number]>(
      '[window.scrollX, window.scrollY]',
    );
    const area = { x, y, ...this.viewport };

    if (this.shrink === null) {
      const small = await cdp.send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: WEB_DRIVER.glanceQuality,
        clip: { ...area, scale: WEB_DRIVER.glanceScale / this.pixelRatio },
      });

      return { data: small.data, mimeType: 'image/jpeg' };
    }

    const whole = await cdp.send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: WEB_DRIVER.wholeQuality,
      clip: { ...area, scale: 1 },
    });
    const shrunk = this.shrink({
      image: Buffer.from(whole.data, 'base64'),
      width: Math.round(this.viewport.width * WEB_DRIVER.glanceScale),
      height: Math.round(this.viewport.height * WEB_DRIVER.glanceScale),
      quality: WEB_DRIVER.glanceQuality,
    });

    return { data: shrunk.toString('base64'), mimeType: 'image/jpeg' };
  }

  /** What the page shows, and the dialogs it opened since the last look, with how each was answered. */
  public async describe(): Promise<string> {
    if (!this.page) return '';

    const page = await describePage(this.page);
    const shown = this.dialogs.splice(0);

    return shown.length === 0 ? page : [page, 'DIALOGS:', ...shown].join('\n');
  }

  /** The pages the open page's header and menus lead to, on its own site, in the order they show. */
  public async navigation(): Promise<string[]> {
    if (!this.page) return [];

    const hrefs = await this.page
      .$$eval('header a[href], nav a[href]', (links) =>
        links.map((link) => (link as unknown as { href: string }).href),
      )
      .catch(() => []);

    return pagesOf({ hrefs, current: this.page.url() });
  }

  public async shoot(file: string): Promise<IShot | null> {
    if (!this.page) return null;

    const image = await this.page.screenshot({ path: file, type: 'jpeg', quality: 70 });

    return { file, dataUrl: `data:image/jpeg;base64,${image.toString('base64')}` };
  }

  public async stream(onFrame: (jpeg: Buffer) => void): Promise<boolean> {
    if (!this.context || !this.page) return false;

    await this.watch(onFrame);

    return true;
  }

  /** Streams at the display's full detail while the QA watches the device up close, and at 1x otherwise. */
  public async focus(isFocused: boolean): Promise<void> {
    this.isFocused = isFocused;
    await this.recast();
  }

  /** Gives the page a new window size mid-run, and the stream the frames to match. */
  public async resize(viewport: IViewport): Promise<void> {
    this.viewport = viewport;

    if (!this.page) return;

    await this.page.setViewportSize(viewport);
    await this.fit();
    await this.recast();
  }

  public async close(): Promise<void> {
    await this.screencast?.detach().catch(() => undefined);
    await this.cdp?.detach().catch(() => undefined);
    this.screencast = null;
    this.cdp = null;
    this.onFrame = null;
    await this.context?.close().catch(() => undefined);
    this.context = null;
    this.page = null;
  }

  /** Streams the open tab's frames to whoever watches; a new tab needs a new watch. */
  private async watch(onFrame: (jpeg: Buffer) => void): Promise<void> {
    if (!this.context || !this.page) return;

    const session = await this.context.newCDPSession(this.page);

    session.on('Page.screencastFrame', (frame) => {
      onFrame(Buffer.from(frame.data, 'base64'));
      void session
        .send('Page.screencastFrameAck', { sessionId: frame.sessionId })
        .catch(() => undefined);
    });

    this.screencast = session;
    this.onFrame = onFrame;
    await this.cast();
  }

  /** Turns to a tab the app opened, the way a person's eyes do, and back to the one that opened it when it closes. */
  private async adopt(page: Page): Promise<void> {
    const opener = await page.opener().catch(() => null);

    if (opener === null) return;

    page.once('close', () => {
      if (this.page === page && !opener.isClosed()) void this.show(opener);
    });
    await this.show(page);
  }

  private async show(page: Page): Promise<void> {
    await this.screencast?.detach().catch(() => undefined);
    await this.cdp?.detach().catch(() => undefined);
    this.screencast = null;
    this.cdp = null;
    this.page = page;
    await page.waitForLoadState('domcontentloaded').catch(() => undefined);
    await page.setViewportSize(this.viewport).catch(() => undefined);
    await this.fit();

    if (this.onFrame) await this.watch(this.onFrame);
  }

  /** Keeps every site a tab opened, so a fresh start clears what each one stored, and answers its dialogs, OK unless the action said cancel. */
  private follow(page: Page): void {
    page.on('framenavigated', (frame) => {
      const origin = originOf(frame.url());

      if (origin !== null) this.origins.add(origin);
    });
    page.on('dialog', (dialog) => {
      const isOk = this.dialogAnswer === 'ok';
      const typed = dialog.type() === 'prompt' ? this.promptText : null;
      const answer = typed === null ? '' : ` with "${typed}"`;

      this.dialogs.push(
        `${dialog.type()}: ${dialog.message()} (answered ${isOk ? `OK${answer}` : 'Cancel'})`,
      );
      void (
        isOk ? dialog.accept(typed ?? dialog.defaultValue()) : dialog.dismiss()
      ).catch(() => undefined);
    });
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

    const locator = await findLocator({
      page,
      target: action.target,
      kind: action.kind === 'fill' ? 'fill' : 'click',
    });

    if (!locator) throw new Error(`Nothing on the page answers to "${action.target}".`);

    if (action.kind !== 'fill') {
      await locator.click({ timeout: WEB_DRIVER.actionTimeoutMs });

      return;
    }

    const options = await locator
      .evaluate((element) => {
        const select = element as unknown as {
          tagName: string;
          options?: { [index: number]: { label: string; value: string }; length: number };
        };

        if (select.tagName !== 'SELECT' || !select.options) return null;

        return Array.from({ length: select.options.length }, (_, index) => ({
          label: select.options?.[index]?.label ?? '',
          value: select.options?.[index]?.value ?? '',
        }));
      })
      .catch(() => null);
    const timeout = WEB_DRIVER.actionTimeoutMs;

    if (options === null) {
      await locator.fill(action.value, { timeout }).catch(async (reason: unknown) => {
        const type = await locator.getAttribute('type').catch(() => null);
        const format = FIELD_FORMATS[type ?? ''];

        throw format === undefined
          ? reason
          : new Error(`"${action.target}" takes ${format}.`);
      });

      return;
    }

    const option = optionOf({ options, wanted: action.value });

    if (option === null)
      throw new Error(
        `"${action.target}" has no option "${action.value}". It offers: ${options.map(({ label }) => label).join(', ')}.`,
      );

    await locator.selectOption(option.value, { timeout });
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

  private async session(): Promise<CDPSession | null> {
    if (!this.context || !this.page) return null;

    this.cdp ??= await this.context.newCDPSession(this.page);

    return this.cdp;
  }

  /** Sizes the window around the viewport, so the stream frames the whole page and nothing below it. */
  private async fit(): Promise<void> {
    const cdp = await this.session();

    if (!cdp) return;

    await cdp
      .send('Browser.getWindowForTarget')
      .then(({ windowId }) =>
        cdp.send('Browser.setContentsSize', { windowId, ...this.viewport }),
      )
      .catch(() => undefined);
  }

  private async recast(): Promise<void> {
    if (!this.screencast) return;

    await this.screencast.send('Page.stopScreencast').catch(() => undefined);
    await this.cast().catch(() => undefined);
    await this.still();
  }

  /** Caps a frame by its height alone: Chrome keeps a window 500 pixels wide, so a narrower page comes framed wider. */
  private async cast(): Promise<void> {
    const detail = this.isFocused ? this.pixelRatio : 1;

    await this.screencast?.send('Page.startScreencast', {
      format: 'jpeg',
      quality: WEB_DRIVER.streamQuality,
      maxHeight: Math.round(this.viewport.height * detail),
    });
  }

  /** Hands the stream the page as it stands: a page standing still sends no frame when the stream restarts. */
  private async still(): Promise<void> {
    const shot = await this.screencast
      ?.send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: WEB_DRIVER.streamQuality,
      })
      .catch(() => null);

    if (shot) this.onFrame?.(Buffer.from(shot.data, 'base64'));
  }

  /** Waits for what an action started to finish, so the page the agent reads next is the new one. */
  private async settle(page: Page): Promise<void> {
    await page
      .waitForLoadState('networkidle', { timeout: WEB_DRIVER.settleMs })
      .catch(() => undefined);
  }
}
