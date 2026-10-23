import { homedir } from 'node:os';
import { hydrateShellPath } from './hydrateShellPath';
import { searchDirectories } from './searchDirectories';

/** Every directory a command could be in on this machine, the one place main looks commands up. */
export async function machineDirectories(): Promise<string[]> {
  return searchDirectories({
    appPath: process.env.PATH,
    shellPath: await hydrateShellPath(),
    home: homedir(),
    platform: process.platform,
    env: process.env,
  });
}
