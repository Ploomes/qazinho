import type { IProcessRow } from '@/main/types';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { spawnCommand } from '@/main/library';
import { WINDOWS_SWEEP } from './constants';
import { parseWindowsSweep } from './library';

/** Every process on a Windows machine, read by one PowerShell kept open: starting PowerShell for each look would cost more than what it measures. */
export class WindowsProcesses {
  private child: ChildProcessWithoutNullStreams | null = null;
  private heard = '';
  private answer: ((text: string | null) => void) | null = null;

  /** The pid of the PowerShell doing the looking, so it is not charged to the app. */
  public get pid(): number | null {
    return this.child?.pid ?? null;
  }

  /** One look at every process, or none when PowerShell did not answer in time. */
  public async sweep(): Promise<IProcessRow[]> {
    const child = this.child ?? this.start();
    const text = await new Promise<string | null>((settle) => {
      const timer = setTimeout(() => {
        this.stop();
        settle(null);
      }, WINDOWS_SWEEP.timeoutMs);

      this.answer = (said) => {
        clearTimeout(timer);
        settle(said);
      };
      child.stdin.write('\n');
    });

    return text === null ? [] : parseWindowsSweep(text);
  }

  /** Closes the PowerShell; the next look starts another. */
  public stop(): void {
    this.child?.kill();
    this.child = null;
    this.heard = '';
    this.answer?.(null);
    this.answer = null;
  }

  private start(): ChildProcessWithoutNullStreams {
    const child = spawnCommand({
      command: 'powershell.exe',
      args: [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-EncodedCommand',
        Buffer.from(WINDOWS_SWEEP.script, 'utf16le').toString('base64'),
      ],
    });

    child.stdout.on('data', (chunk: Buffer) => {
      this.heard += chunk.toString('utf8');

      const end = this.heard.indexOf(WINDOWS_SWEEP.endMark);

      if (end === -1) return;

      const said = this.heard.slice(0, end);

      this.heard = this.heard.slice(end + WINDOWS_SWEEP.endMark.length);
      this.answer?.(said);
      this.answer = null;
    });
    child.on('error', () => {
      this.stop();
    });
    child.on('close', () => {
      if (this.child === child) this.stop();
    });
    this.child = child;

    return child;
  }
}
