import { describe, expect, it } from 'vitest';
import { signInScript } from '@/main/classes/integrations/AgentMcp/library';

describe('signInScript', () => {
  it('opens the agent on its MCP list, from QAzinho own folder, in a login shell', () => {
    const script = signInScript({
      command: '/opt/bin/claude',
      args: ['/mcp'],
      folder: '/data/agent',
      server: 'figma',
    });

    expect(script.split('\n')[0]).toBe('#!/bin/zsh -l');
    expect(script).toContain("cd '/data/agent'");
    expect(script).toContain("exec '/opt/bin/claude' '/mcp'");
  });

  /** A path with a quote in it must not end the string and run the rest as a command. */
  it('quotes a path with a quote in it', () => {
    expect(
      signInScript({
        command: "/Users/o'brien/claude",
        args: ['/mcp'],
        folder: '/x',
        server: 'figma',
      }),
    ).toContain(`exec '/Users/o'\\''brien/claude' '/mcp'`);
  });
});
