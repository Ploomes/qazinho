import { describe, expect, it } from 'vitest';
import { comboOf } from '@/hooks/useKeybinds/library';

const NONE = { metaKey: false, ctrlKey: false, altKey: false, shiftKey: false };

describe('comboOf', () => {
  it('reads a command shortcut the way it is written in Settings', () => {
    expect(comboOf({ ...NONE, key: 'n', metaKey: true })).toBe('⌘N');
  });

  it('control stands in for command, so one shortcut works on every machine', () => {
    expect(comboOf({ ...NONE, key: 'n', ctrlKey: true })).toBe('⌘N');
  });

  it('holds the modifiers in one order, so two spellings never disagree', () => {
    const held = { metaKey: true, ctrlKey: false, altKey: true, shiftKey: true };

    expect(comboOf({ ...held, key: 'p' })).toBe('⌘⌥⇧P');
  });

  it('names the keys nobody can print', () => {
    expect(comboOf({ ...NONE, key: 'Enter', metaKey: true })).toBe('⌘↵');
    expect(comboOf({ ...NONE, key: 'Escape' })).toBe('⎋');
  });

  it('a modifier on its own is not a shortcut, it is the start of one', () => {
    expect(comboOf({ ...NONE, key: 'Meta', metaKey: true })).toBeNull();
    expect(comboOf({ ...NONE, key: 'Shift', shiftKey: true })).toBeNull();
  });

  it('a punctuation key keeps itself', () => {
    expect(comboOf({ ...NONE, key: ',', metaKey: true })).toBe('⌘,');
    expect(comboOf({ ...NONE, key: '\\', metaKey: true })).toBe('⌘\\');
  });
});
