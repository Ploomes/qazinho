export const INSTALL = {
  timeoutMs: 10 * 60_000,
  checkTimeoutMs: 60_000,
  tailLines: 40,
  missing: {
    npm: 'QAzinho installs agents with npm, and this machine has no npm. Install Node.js from nodejs.org, then try again.',
    brew: 'QAzinho installs this with Homebrew, and this machine has no Homebrew. Install it from brew.sh, then try again.',
    python3:
      'Installing idb needs Python 3, and this machine has none. Install the Command Line Tools with xcode-select --install, then try again.',
  } as Record<string, string>,
} as const;
