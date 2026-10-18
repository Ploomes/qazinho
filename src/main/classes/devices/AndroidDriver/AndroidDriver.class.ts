import type { IAndroidDriver } from './types';
import type { IDeviceDriver, IShot } from '@/main/classes/devices/types';
import type { IActionMotion, IDeviceImage, IStepAction, IViewport } from '@/shared/types';
import { spawn } from 'node:child_process';
import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ANDROID } from './constants';
import {
  describeScreen,
  findNode,
  frontPackage,
  launchArgs,
  needsReinstall,
  newestBuildTools,
  packageOfApk,
  parseDevices,
  parseViewHierarchy,
  runAdb,
  runAdbRaw,
} from './library';

/** Drives an Android emulator through adb. The QA watches the phone work. */
export class AndroidDriver implements IDeviceDriver {
  private readonly sdkRoot: string;
  private readonly avd: string;
  private readonly apk: string;
  private serial = '';
  private app = '';
  private isOurs = false;

  public constructor(props: IAndroidDriver) {
    this.sdkRoot = props.sdkRoot;
    this.avd = props.avd;
    this.apk = props.apk;
  }

  public async open(): Promise<void> {
    this.serial = (await this.running())[0] ?? (await this.boot());
    this.app = await this.install();

    await this.launchFresh();
  }

  /** Starts the app over with its data cleared, the way it was the day it was installed. */
  public async restart(): Promise<void> {
    if (this.serial.length === 0) throw new Error('The emulator is not open.');

    await this.launchFresh();
  }

  public async act(action: IStepAction): Promise<void> {
    if (this.serial.length === 0) throw new Error('The emulator is not open.');

    if (action.kind === 'wait') {
      await new Promise((wake) =>
        setTimeout(wake, Number(action.value) || ANDROID.waitMs),
      );

      return;
    }

    if (action.kind === 'press') {
      await this.shell(['input', 'keyevent', this.keyOf(action.target)]);
      await this.settle();

      return;
    }

    if (action.kind === 'goto') {
      await this.launch();

      return;
    }

    const node = findNode({ nodes: await this.read(), target: action.target });

    if (!node) throw new Error(`Nothing on the screen answers to "${action.target}".`);

    await this.shell(['input', 'tap', String(node.x), String(node.y)]);

    if (action.kind === 'fill') {
      await this.settle();
      await this.shell(['input', 'text', action.value.replace(/ /g, '%s')]);
    }

    await this.settle();
  }

  public async describe(): Promise<string> {
    const focused = await this.shell(['dumpsys', 'window']).catch(() => '');

    return describeScreen({
      nodes: await this.read(),
      app: frontPackage(focused) || this.app,
    });
  }

  /** The emulator's screen as the agent reads it, straight from screencap. */
  public async glance(): Promise<IDeviceImage | null> {
    if (this.serial.length === 0) return null;

    const image = await this.raw(['exec-out', 'screencap', '-p']);

    return { data: image.toString('base64'), mimeType: 'image/png' };
  }

  /** A phone has no layout-shift timeline to read, so it says nothing about motion. */
  public async motion(): Promise<IActionMotion | null> {
    return Promise.resolve(null);
  }

  /** A emulator keeps the size of the device it is, so a new window size changes nothing. */
  public async resize(_viewport: IViewport): Promise<void> {
    return Promise.resolve();
  }

  /** An emulator is not streamed, so watching it up close changes nothing. */
  public async focus(): Promise<void> {
    return Promise.resolve();
  }

  public async shoot(file: string): Promise<IShot | null> {
    if (this.serial.length === 0) return null;

    const image = await this.raw(['exec-out', 'screencap', '-p']);

    await writeFile(file, image);

    return { file, dataUrl: `data:image/png;base64,${image.toString('base64')}` };
  }

  /** QAzinho only shuts down what QAzinho started: an emulator the QA opened stays open. */
  public async stream(): Promise<boolean> {
    return Promise.resolve(false);
  }

  public async close(): Promise<void> {
    if (this.isOurs && this.serial.length > 0)
      await this.adb(['emu', 'kill']).catch(() => '');

    this.serial = '';
    this.isOurs = false;
  }

  private async launchFresh(): Promise<void> {
    await this.shell(['am', 'force-stop', this.app]);
    await this.shell(['pm', 'clear', this.app]);
    await this.launch();
  }

  private async launch(): Promise<void> {
    await this.shell(launchArgs(this.app));
    await this.settle();
  }

  private async boot(): Promise<string> {
    const emulator = join(this.sdkRoot, 'emulator', 'emulator');

    spawn(emulator, ['-avd', this.avd, '-no-boot-anim'], {
      detached: true,
      stdio: 'ignore',
    }).unref();

    this.isOurs = true;

    const until = Date.now() + ANDROID.bootTimeoutMs;

    while (Date.now() < until) {
      const [serial] = await this.running();

      if (serial !== undefined) {
        const booted = await runAdb({
          adb: this.adbPath(),
          args: ['-s', serial, 'shell', 'getprop', 'sys.boot_completed'],
        }).catch(() => '');

        if (booted.trim() === '1') return serial;
      }

      await new Promise((wake) => setTimeout(wake, ANDROID.waitMs));
    }

    throw new Error(`The emulator ${this.avd} did not finish booting.`);
  }

  private async install(): Promise<string> {
    const tools = newestBuildTools(
      await readdir(join(this.sdkRoot, 'build-tools')).catch(() => []),
    );

    if (tools === null)
      throw new Error(
        'No build-tools in the Android SDK, so QAzinho cannot read the apk.',
      );

    const dumped = await runAdb({
      adb: join(this.sdkRoot, 'build-tools', tools, 'aapt2'),
      args: ['dump', 'packagename', this.apk],
    });

    const app = packageOfApk(dumped);

    if (app === null) throw new Error(`${this.apk} does not name a package.`);

    await this.adb(['install', '-r', '-t', this.apk]).catch(async (reason: unknown) => {
      if (!needsReinstall(String(reason))) throw reason;

      await this.adb(['uninstall', app]);
      await this.adb(['install', '-t', this.apk]);
    });

    return app;
  }

  private async read() {
    await this.shell(['uiautomator', 'dump', ANDROID.dumpFile]);

    return parseViewHierarchy(await this.shell(['cat', ANDROID.dumpFile]));
  }

  private async running(): Promise<string[]> {
    return parseDevices(await this.adb(['devices']).catch(() => ''));
  }

  private keyOf(target: string): string {
    return ANDROID.keys[target.toLowerCase()] ?? 'KEYCODE_ENTER';
  }

  private adbPath(): string {
    return join(this.sdkRoot, 'platform-tools', 'adb');
  }

  private async adb(args: string[]): Promise<string> {
    return runAdb({ adb: this.adbPath(), args: this.addressed(args) });
  }

  private async shell(args: string[]): Promise<string> {
    return this.adb(['shell', ...args]);
  }

  private async raw(args: string[]): Promise<Buffer> {
    return runAdbRaw({ adb: this.adbPath(), args: this.addressed(args) });
  }

  private addressed(args: string[]): string[] {
    return this.serial.length > 0 ? ['-s', this.serial, ...args] : args;
  }

  private async settle(): Promise<void> {
    await new Promise((wake) => setTimeout(wake, ANDROID.settleMs));
  }
}
