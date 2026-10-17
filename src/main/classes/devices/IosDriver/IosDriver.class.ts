import type { IIosDriver } from './types';
import type { IDeviceDriver, IShot } from '@/main/classes/devices/types';
import type { IStepAction } from '@/types';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { IOS } from './constants';
import {
  bundleOfPlist,
  describeIosScreen,
  findElement,
  parseBooted,
  parseElements,
  runTool,
} from './library';

/** Drives an iOS simulator. simctl boots and installs; only idb can touch the screen. */
export class IosDriver implements IDeviceDriver {
  private readonly idb: string;
  private readonly udid: string;
  private readonly app: string;
  private bundle = '';
  private isOurs = false;

  public constructor(props: IIosDriver) {
    this.idb = props.idb;
    this.udid = props.udid;
    this.app = props.app;
  }

  public async open(): Promise<void> {
    if (!(await this.isBooted())) {
      await this.simctl(['boot', this.udid]);
      this.isOurs = true;
    }

    await this.simctl(['bootstatus', this.udid, '-b']);

    this.bundle = await this.identify();

    await this.simctl(['install', this.udid, this.app]);
    await this.simctl(['launch', this.udid, this.bundle]);
    await this.settle();
  }

  public async act(action: IStepAction): Promise<void> {
    if (action.kind === 'wait') {
      await new Promise((wake) => setTimeout(wake, Number(action.value) || IOS.waitMs));

      return;
    }

    if (action.kind === 'press') {
      await this.ui([
        'key',
        IOS.keys[action.target.toLowerCase()] ?? IOS.keys.enter ?? '40',
      ]);
      await this.settle();

      return;
    }

    if (action.kind === 'goto') {
      await this.simctl(['launch', this.udid, this.bundle]);
      await this.settle();

      return;
    }

    const element = findElement({ elements: await this.read(), target: action.target });

    if (!element) throw new Error(`Nothing on the screen answers to "${action.target}".`);

    await this.ui(['tap', String(element.x), String(element.y)]);

    if (action.kind === 'fill') {
      await this.settle();
      await this.ui(['text', action.value]);
    }

    await this.settle();
  }

  public async describe(): Promise<string> {
    return describeIosScreen({ elements: await this.read(), app: this.bundle });
  }

  public async shoot(file: string): Promise<IShot | null> {
    await this.simctl(['io', this.udid, 'screenshot', file]);

    const image = await readFile(file);

    return { file, dataUrl: `data:image/png;base64,${image.toString('base64')}` };
  }

  /** QAzinho only shuts down what QAzinho started: a simulator the QA opened stays open. */
  public async stream(): Promise<boolean> {
    return Promise.resolve(false);
  }

  public async close(): Promise<void> {
    if (this.isOurs) await this.simctl(['shutdown', this.udid]).catch(() => '');

    this.isOurs = false;
  }

  private async identify(): Promise<string> {
    const printed = await runTool({
      command: 'plutil',
      args: ['-extract', 'CFBundleIdentifier', 'raw', join(this.app, 'Info.plist')],
    });

    const bundle = bundleOfPlist(printed);

    if (bundle === null)
      throw new Error(`${this.app} does not name a bundle identifier.`);

    return bundle;
  }

  private async read() {
    return parseElements(await this.ui(['describe-all']));
  }

  private async isBooted(): Promise<boolean> {
    const listed = await this.simctl(['list', 'devices']).catch(() => '');

    return parseBooted(listed).includes(this.udid);
  }

  private async ui(args: string[]): Promise<string> {
    return runTool({ command: this.idb, args: ['ui', ...args, '--udid', this.udid] });
  }

  private async simctl(args: string[]): Promise<string> {
    return runTool({ command: 'xcrun', args: ['simctl', ...args] });
  }

  private async settle(): Promise<void> {
    await new Promise((wake) => setTimeout(wake, IOS.settleMs));
  }
}
