/** How an install ended. A failure carries what the QA can run themselves: the fix it suggested, or the install. */
export type IInstallResult =
  | { isInstalled: true }
  | { isInstalled: false; error: string; command: string; isFix: boolean };
