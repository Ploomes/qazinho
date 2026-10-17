export const INSTALL = {
  timeoutMs: 10 * 60_000,
  tailLines: 12,
  missing: {
    npm: 'QAzinho installs agents with npm, and this machine has no npm. Install Node.js from nodejs.org, then try again.',
    brew: 'QAzinho installs idb with Homebrew, and this machine has no Homebrew. Install it from brew.sh, then try again.',
    pipx: 'pipx did not land where QAzinho looks for it. Run the command below in a terminal.',
  },
} as const;
