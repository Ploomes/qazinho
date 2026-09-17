import { describe, expect, it } from 'vitest';
import { INSTALL_RECIPES } from '@/main/classes/setup/SetupInstaller/constants';

describe('INSTALL_RECIPES', () => {
  it('installs every agent globally with npm, in one command', () => {
    for (const id of ['claude-code', 'codex', 'gemini-cli'] as const) {
      const [step, ...rest] = INSTALL_RECIPES[id];

      expect(rest).toEqual([]);
      expect(step?.command).toBe('npm');
      expect(step?.args.slice(0, 2)).toEqual(['install', '-g']);
    }
  });

  it('installs the idb companion before the client that talks to it', () => {
    const commands = INSTALL_RECIPES.idb.map(
      (step) => `${step.command} ${step.args.join(' ')}`,
    );

    expect(commands.indexOf('brew install facebook/fb/idb-companion')).toBeLessThan(
      commands.indexOf('pipx install fb-idb'),
    );
  });

  it('has pipx installed before it is used', () => {
    const commands = INSTALL_RECIPES.idb.map(
      (step) => `${step.command} ${step.args.join(' ')}`,
    );

    expect(commands.indexOf('brew install pipx')).toBeLessThan(
      commands.indexOf('pipx install fb-idb'),
    );
  });
});
