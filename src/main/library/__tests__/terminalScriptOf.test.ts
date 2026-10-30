import { describe, expect, it } from 'vitest';
import { terminalScriptOf } from '@/main/library';

describe('terminalScriptOf', () => {
  it('says what to do, then runs the command from QAzinho own folder, in a login shell', () => {
    const script = terminalScriptOf({
      command: '/opt/bin/claude',
      args: ['/mcp'],
      folder: '/data/agent',
      say: 'QAzinho: sign in.',
      platform: 'darwin',
    });

    expect(script.split('\n')[0]).toBe('#!/bin/zsh -l');
    expect(script).toContain("cd '/data/agent'");
    expect(script).toContain("exec '/opt/bin/claude' '/mcp'");
  });

  /**
   * Um caminho com aspas nele não pode terminar a string e rodar o resto como comando.
   */
  it('quotes a path with a quote in it', () => {
    expect(
      terminalScriptOf({
        command: "/Users/o'brien/claude",
        args: ['/mcp'],
        folder: '/x',
        say: 'QAzinho: sign in.',
        platform: 'darwin',
      }),
    ).toContain(`exec '/Users/o'\\''brien/claude' '/mcp'`);
  });

  it('runs in the plain shell on Linux, where zsh may not be', () => {
    expect(
      terminalScriptOf({
        command: '/usr/bin/claude',
        args: ['/mcp'],
        folder: '/data',
        say: 'QAzinho: sign in.',
        platform: 'linux',
      }).split('\n')[0],
    ).toBe('#!/bin/sh');
  });

  /**
   * O cmd.exe expandiria um sinal de porcentagem num caminho, e um shim do npm precisa
   * ser chamado para voltar.
   */
  it('writes a batch file on Windows, its paths quoted and its percent signs doubled', () => {
    const script = terminalScriptOf({
      command: 'C:\\Users\\Ana\\AppData\\Roaming\\npm\\claude.cmd',
      args: ['/mcp'],
      folder: 'C:\\Users\\Ana\\100% QA',
      say: 'QAzinho: sign in.',
      platform: 'win32',
    });

    expect(script.split('\r\n')).toEqual([
      '@echo off',
      'cd /d "C:\\Users\\Ana\\100%% QA"',
      'cls',
      'echo QAzinho: sign in.',
      'call "C:\\Users\\Ana\\AppData\\Roaming\\npm\\claude.cmd" "/mcp"',
      '',
    ]);
  });
});
