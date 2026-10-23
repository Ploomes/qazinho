import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const TIMEOUT_MS = 2_000;
const MARK = '__QAZINHO_PATH__';

/** The PATH the QA's login shell sets, which an app opened from Finder or a desktop menu never inherits; none on Windows, where apps get the user's PATH. */
export async function hydrateShellPath(): Promise<string | undefined> {
  if (process.platform === 'win32') return undefined;

  const shell =
    process.env.SHELL ?? (process.platform === 'darwin' ? '/bin/zsh' : '/bin/sh');

  try {
    const { stdout } = await run(shell, ['-ilc', `printf '${MARK}%s${MARK}' "$PATH"`], {
      timeout: TIMEOUT_MS,
    });

    return new RegExp(`${MARK}(.*)${MARK}`, 's').exec(stdout)?.[1]?.trim();
  } catch {
    return undefined;
  }
}
