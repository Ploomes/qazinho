/** Onde está a toolchain do Android, e qual emulador uma run deve abrir. */
export interface IAndroidSetup {
  sdkRoot: string;
  avd: string;
}
