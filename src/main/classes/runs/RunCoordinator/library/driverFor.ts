import type { IWalkRun } from '@/main/classes/runs/RunCoordinator/types';
import type { ShrinkImage } from '@/main/types';
import type { IDeviceScreen } from '@salve-software/qazinho-harness';
import type { IDeviceDriver, IWindowPlace } from '@salve-software/qazinho-harness/engine';
import {
  AndroidDriver,
  IosDriver,
  WebDriver,
  webAccessOf,
} from '@salve-software/qazinho-harness/engine';

/**
 * Um plano, uma porta, seja o Chrome ou um celular, numa janela em `window` para o QA
 * usar; o Chrome entra num ambiente protegido com as variáveis.
 */
export function driverFor(props: {
  run: IWalkRun;
  shrink?: ShrinkImage;
  onAddress?: (url: string) => void;
  onScreens?: (screens: IDeviceScreen[]) => void;
  window?: IWindowPlace;
  onClosed?: () => void;
}): IDeviceDriver {
  const { run } = props;

  if (run.target.kind === 'android')
    return new AndroidDriver({
      sdkRoot: run.sdkRoot,
      avd: run.avd,
      apk: run.target.value,
      ...(props.shrink === undefined ? {} : { shrink: props.shrink }),
      ...(props.window === undefined ? {} : { window: props.window }),
      ...(props.onClosed === undefined ? {} : { onClosed: props.onClosed }),
    });

  if (run.target.kind === 'ios')
    return new IosDriver({
      idb: run.idb,
      udid: run.udid,
      app: run.target.value,
      ...(props.shrink === undefined ? {} : { shrink: props.shrink }),
      ...(props.window === undefined ? {} : { window: props.window }),
      ...(props.onClosed === undefined ? {} : { onClosed: props.onClosed }),
    });

  return new WebDriver({
    url: run.target.value,
    profileDir: run.profileDir,
    viewport: run.viewport,
    pixelRatio: run.pixelRatio,
    access: webAccessOf(run.values),
    ...(props.shrink === undefined ? {} : { shrink: props.shrink }),
    ...(props.onAddress === undefined ? {} : { onAddress: props.onAddress }),
    ...(props.onScreens === undefined ? {} : { onScreens: props.onScreens }),
    ...(props.window === undefined ? {} : { window: props.window }),
    ...(props.onClosed === undefined ? {} : { onClosed: props.onClosed }),
  });
}
