/** Stops an agent and everything it started: on POSIX the agent leads its own process group. */
export function killTree(child: {
  pid?: number | undefined;
  kill: (signal: NodeJS.Signals) => boolean;
}): void {
  if (child.pid === undefined) return;

  if (process.platform === 'win32') {
    child.kill('SIGTERM');

    return;
  }

  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
}
