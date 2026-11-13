import { describe, expect, it } from 'vitest';
import { diagnosticsOf } from '@/main/library';

describe('diagnosticsOf', () => {
  it('says the version, the machine, what was found and the last lines of the log', () => {
    const text = diagnosticsOf({
      version: '0.1.0',
      system: 'Windows 10.0.22631 x64',
      versions: { electron: '44.3.0', chrome: '146.0', node: '24.1.0' },
      locale: 'pt-BR',
      agents: [
        {
          id: 'claude-code',
          name: 'Claude Code',
          command: 'claude',
          isFound: true,
          path: 'C:\\Users\\Ana\\AppData\\Roaming\\npm\\claude.cmd',
          defaultModel: null,
          isSignedIn: null,
        },
      ],
      devices: {
        androidSdk: {
          isFound: true,
          path: 'C:\\Users\\Ana\\AppData\\Local\\Android\\Sdk',
        },
        xcode: { isFound: false, path: null },
        axe: { isFound: false, path: null },
      },
      log: ['2026-10-24T03:00:00.000Z ERROR [main] boom'],
    });

    expect(text.split('\n')).toEqual([
      'QAzinho 0.1.0',
      'System: Windows 10.0.22631 x64',
      'Electron 44.3.0 · Chrome 146.0 · Node 24.1.0',
      'Locale: pt-BR',
      'Agents:',
      '- Claude Code: found yes, signed in unknown',
      'Devices:',
      '- Android SDK: yes',
      '- Xcode: no',
      '- AXe: no',
      '',
      'Last 1 lines of the log:',
      '2026-10-24T03:00:00.000Z ERROR [main] boom',
    ]);
  });

  it('keeps the paths it was told out, since they name the user', () => {
    expect(
      diagnosticsOf({
        version: '0.1.0',
        system: 'macOS',
        versions: { electron: '1', chrome: '1', node: '1' },
        locale: 'en',
        agents: [
          {
            id: 'codex',
            name: 'Codex',
            command: 'codex',
            isFound: true,
            path: '/Users/ana/.npm/bin/codex',
            defaultModel: null,
            isSignedIn: true,
          },
        ],
        devices: {
          androidSdk: { isFound: false, path: null },
          xcode: { isFound: true, path: '/Applications/Xcode.app' },
          axe: { isFound: true, path: '/Users/ana/.local/bin/axe' },
        },
        log: [],
      }),
    ).not.toMatch(/\/Users\/ana/);
  });
});
