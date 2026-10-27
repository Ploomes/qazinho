import type { InstallFailure } from './InstallFailure';

/**
 * How an install ended. A failure carries why, and what the QA can run themselves: the
 * fix it suggested, or the install.
 */
export type IInstallResult =
  | { isInstalled: true }
  | { isInstalled: false; failure: InstallFailure; command: string; isFix: boolean };
