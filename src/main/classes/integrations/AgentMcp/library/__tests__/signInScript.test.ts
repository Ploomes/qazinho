import { describe, expect, it } from 'vitest';
import { signInScript } from '@/main/classes/integrations/AgentMcp/library';

describe('signInScript', () => {
  it('opens the agent on its MCP list, from QAzinho own folder, in a login shell', () => {
    const script = signInScript({
      command: '/opt/bin/claude',
      args: ['/mcp'],
      folder: '/data/agent',
      server: 'figma',
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
      signInScript({
        command: "/Users/o'brien/claude",
        args: ['/mcp'],
        folder: '/x',
        server: 'figma',
        platform: 'darwin',
      }),
    ).toContain(`exec '/Users/o'\\''brien/claude' '/mcp'`);
  });

  it('runs in the plain shell on Linux, where zsh may not be', () => {
    expect(
      signInScript({
        command: '/usr/bin/claude',
        args: ['/mcp'],
        folder: '/data',
        server: 'figma',
        platform: 'linux',
      }).split('\n')[0],
    ).toBe('#!/bin/sh');
  });

  /**
   * O cmd.exe expandiria um sinal de porcentagem num caminho, e um shim do npm precisa
   * ser chamado para voltar.
   */
  it('writes a batch file on Windows, its paths quoted and its percent signs doubled', () => {
    const script = signInScript({
      command: 'C:\\Users\\Ana\\AppData\\Roaming\\npm\\claude.cmd',
      args: ['/mcp'],
      folder: 'C:\\Users\\Ana\\100% QA',
      server: 'figma',
      platform: 'win32',
    });

    expect(script.split('\r\n')).toEqual([
      '@echo off',
      'cd /d "C:\\Users\\Ana\\100%% QA"',
      'cls',
      'echo QAzinho: pick "figma" below, choose Authenticate and finish in the browser. Then close this window.',
      'call "C:\\Users\\Ana\\AppData\\Roaming\\npm\\claude.cmd" "/mcp"',
      '',
    ]);
  });
});
