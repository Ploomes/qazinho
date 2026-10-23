import { describe, expect, it } from 'vitest';
import { comboLabelOf } from '@/shared/hooks/useKeybinds/library';

describe('comboLabelOf', () => {
  it('keeps the Mac symbols on a Mac', () => {
    expect(comboLabelOf({ combo: '⌘⇧N', isMac: true })).toBe('⌘⇧N');
  });

  it('names Ctrl, Alt and Shift on Windows and Linux', () => {
    expect(comboLabelOf({ combo: '⌘↵', isMac: false })).toBe('Ctrl+↵');
    expect(comboLabelOf({ combo: '⌘⌥⇧K', isMac: false })).toBe('Ctrl+Alt+Shift+K');
  });

  it('leaves a key with nothing held as it is', () => {
    expect(comboLabelOf({ combo: '?', isMac: false })).toBe('?');
  });
});
