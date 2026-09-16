import type { IDeviceDriver } from '@/main/classes/devices/types';
import type { IWalkRun } from '@/main/classes/runs/RunCoordinator/types';
import { AndroidDriver } from '@/main/classes/devices/AndroidDriver';
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
    throw new Error(
      'gocrash cannot drive an iOS simulator yet: tapping a simulator needs XCUITest, which is not built. Pick a web or Android target.',
    );

  return new WebDriver({ url: run.target.value, profileDir: run.profileDir });
}
