import { homedir } from 'node:os';
import { hydrateShellPath } from './hydrateShellPath';
import { searchDirectories } from './searchDirectories';

/**
 * Todo diretório em que um comando poderia estar nesta máquina, o único lugar onde a main
 * procura comandos.
 */
export async function machineDirectories(): Promise<string[]> {
  return searchDirectories({
    appPath: process.env.PATH,
    shellPath: await hydrateShellPath(),
    home: homedir(),
    platform: process.platform,
    env: process.env,
  });
}
