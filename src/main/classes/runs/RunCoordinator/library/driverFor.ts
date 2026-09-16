import type { IDeviceDriver } from '@/main/classes/devices/types';
import type { IWalkRun } from '@/main/classes/runs/RunCoordinator/types';
import { AndroidDriver } from '@/main/classes/devices/AndroidDriver';
import { IosDriver } from '@/main/classes/devices/IosDriver';
import { WebDriver } from '@/main/classes/devices/WebDriver';

/** One plan, one port: the run does not care whether it is driving Chrome or a phone. */
export function driverFor(run: IWalkRun): IDeviceDriver {
  if (run.target.kind === 'android')
    return new AndroidDriver({
      sdkRoot: run.sdkRoot,
      avd: run.avd,
      apk: run.target.value,
    });

  if (run.target.kind === 'ios')
    return new IosDriver({ idb: run.idb, udid: run.udid, app: run.target.value });

  return new WebDriver({ url: run.target.value, profileDir: run.profileDir });
}
