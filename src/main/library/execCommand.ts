import type { ExecFileOptions } from 'node:child_process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { COMMAND } from '@/main/constants';
import { launchHere } from './launchHere';

const run = promisify(execFile);

/** Runs a command to its end the way this platform needs, and answers with what it printed; rejects as execFile does, with what it printed on the error. */
export async function execCommand(props: {
  command: string;
  args: string[];
  options?: ExecFileOptions;
}): Promise<{ stdout: string; stderr: string }> {
  const launch = launchHere(props);
  const { stdout, stderr } = await run(launch.file, launch.args, {
    maxBuffer: COMMAND.maxBufferBytes,
    ...props.options,
    encoding: 'utf8',
    windowsHide: true,
    windowsVerbatimArguments: launch.isVerbatim,
  });

  return { stdout, stderr };
}
