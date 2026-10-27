import type { IWalkRun } from '@/main/classes/runs/RunCoordinator/types';
import type { ShrinkImage } from '@/main/types';
import type { IDeviceDriver } from '@salve-software/qazinho-harness/engine';
import {
  AndroidDriver,
  IosDriver,
  WebDriver,
  webAccessOf,
} from '@salve-software/qazinho-harness/engine';

/**
 * One plan, one port: the run does not care whether it is driving Chrome or a phone;
 * Chrome gets into a protected environment with the project's variables.
 */
export function driverFor(props: { run: IWalkRun; shrink?: ShrinkImage }): IDeviceDriver {
  const { run } = props;

  if (run.target.kind === 'android')
    return new AndroidDriver({
      sdkRoot: run.sdkRoot,
      avd: run.avd,
      apk: run.target.value,
      ...(props.shrink === undefined ? {} : { shrink: props.shrink }),
    });

  if (run.target.kind === 'ios')
    return new IosDriver({
      idb: run.idb,
      udid: run.udid,
      app: run.target.value,
      ...(props.shrink === undefined ? {} : { shrink: props.shrink }),
    });

  return new WebDriver({
    url: run.target.value,
    profileDir: run.profileDir,
    viewport: run.viewport,
    pixelRatio: run.pixelRatio,
    access: webAccessOf(run.values),
    ...(props.shrink === undefined ? {} : { shrink: props.shrink }),
  });
}
