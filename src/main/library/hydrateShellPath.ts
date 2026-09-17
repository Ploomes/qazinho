import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const TIMEOUT_MS = 2_000;

/** macOS: an app opened from Finder inherits launchd's PATH, not the one the QA edited. */
export async function hydrateShellPath(): Promise<string | undefined> {
  if (process.platform === 'win32') return undefined;

  const shell = process.env.SHELL ?? '/bin/zsh';

  try {
    const { stdout } = await run(shell, ['-ilc', 'printf %s "$PATH"'], {
      timeout: TIMEOUT_MS,
    });

    return stdout.trim();
  } catch {
    return undefined;
  }
}
