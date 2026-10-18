import { describe, expect, it } from 'vitest';
import { KEYBINDS } from '@/modules/Settings/constants';
import { keybindsOf } from '@/store/SettingsStore/library';

/**
 * Settings used to save each shortcut with its English label, so a Portuguese QA read
 * "Run the plan" under Atalhos forever after. The label now always comes from the table.
 */
describe('keybindsOf', () => {
  it('keeps the keys the QA picked, and takes the name from the table', () => {
    const saved = [{ id: 'run', label: 'Run the plan', combo: '⌘R' }];
    const run = keybindsOf({ saved, table: KEYBINDS }).find(({ id }) => id === 'run');

    expect(run).toEqual({ id: 'run', labelKey: 'SETTINGS.KEYBIND_RUN', combo: '⌘R' });
    expect(run).not.toHaveProperty('label');
  });

  it('gives a shortcut nobody saved the keys it comes with', () => {
    expect(keybindsOf({ saved: [], table: KEYBINDS })).toEqual(KEYBINDS);
  });

  it('drops a shortcut the table no longer has', () => {
    const saved = [{ id: 'gone', combo: '⌘G' }];

    expect(keybindsOf({ saved, table: KEYBINDS }).map(({ id }) => id)).not.toContain(
      'gone',
    );
  });

  it('ignores what is not a list of shortcuts', () => {
    expect(keybindsOf({ saved: 'nope', table: KEYBINDS })).toEqual(KEYBINDS);
    expect(
      keybindsOf({ saved: [null, { id: 'run', combo: 3 }], table: KEYBINDS }),
    ).toEqual(KEYBINDS);
  });
});
