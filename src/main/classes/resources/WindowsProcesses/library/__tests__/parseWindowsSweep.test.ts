import { describe, expect, it } from 'vitest';
import { parseWindowsSweep } from '@/main/classes/resources/WindowsProcesses/library';

describe('parseWindowsSweep', () => {
  it('reads each process with its cpu seconds, its memory and its command line', () => {
    expect(
      parseWindowsSweep(
        [
          '4120\t880\t35000000\t209715200\tQAzinho.exe\t"C:\\Program Files\\QAzinho\\QAzinho.exe"',
          '5000\t4120\t10000000\t104857600\tnode.exe\tnode C:\\npm\\cli.js -p\thi',
          '',
        ].join('\r\n'),
      ),
    ).toEqual([
      {
        pid: 4120,
        parentPid: 880,
        cpuSeconds: 3.5,
        ramMb: 200,
        name: 'QAzinho',
        command: '"C:\\Program Files\\QAzinho\\QAzinho.exe"',
      },
      {
        pid: 5000,
        parentPid: 4120,
        cpuSeconds: 1,
        ramMb: 100,
        name: 'node',
        command: 'node C:\\npm\\cli.js -p\thi',
      },
    ]);
  });

  /**
   * O System Idle Process e os protegidos não dão linha de comando, nem tempo de cpu a um
   * usuário que não pode lê-lo.
   */
  it('names a process with no command line by its own name, and counts no time it did not give', () => {
    expect(parseWindowsSweep('4\t0\t\t1048576\tSystem\t')).toEqual([
      {
        pid: 4,
        parentPid: 0,
        cpuSeconds: 0,
        ramMb: 1,
        name: 'System',
        command: 'System',
      },
    ]);
  });

  it('skips a line that is not a process', () => {
    expect(parseWindowsSweep('__QAZINHO_SWEEP_END__\n\n')).toEqual([]);
  });
});
