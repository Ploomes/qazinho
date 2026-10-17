/** How an install ended. A failure carries what the QA can run themselves. */
export type IInstallResult =
  { isInstalled: true } | { isInstalled: false; error: string; command: string };
