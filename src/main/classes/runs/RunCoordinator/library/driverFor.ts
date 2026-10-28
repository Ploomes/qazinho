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
 * Um plano, uma porta: a run não se importa se está dirigindo o Chrome ou um celular; o
 * Chrome entra num ambiente protegido com as variáveis do projeto.
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
