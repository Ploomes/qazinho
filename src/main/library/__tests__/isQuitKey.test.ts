import type { IKeyPress } from '@/main/types';
import { describe, expect, it } from 'vitest';
import { isQuitKey } from '@/main/library';

const CTRL_Q: IKeyPress = {
  type: 'keyDown',
  key: 'q',
  control: true,
  meta: false,
  alt: false,
  shift: false,
};

describe('isQuitKey', () => {
  /** Um desktop Linux sem bandeja não teria outro jeito de sair do app. */
  it('quits on Ctrl+Q on Linux', () => {
    expect(isQuitKey({ platform: 'linux', press: CTRL_Q })).toBe(true);
    expect(isQuitKey({ platform: 'linux', press: { ...CTRL_Q, key: 'Q' } })).toBe(true);
  });

  it('does NOT quit on Windows, where Ctrl+Q is no quit and the tray always shows', () => {
    expect(isQuitKey({ platform: 'win32', press: CTRL_Q })).toBe(false);
  });

  it('leaves the Mac to its own ⌘Q', () => {
    expect(isQuitKey({ platform: 'darwin', press: CTRL_Q })).toBe(false);
    expect(
      isQuitKey({ platform: 'darwin', press: { ...CTRL_Q, control: false, meta: true } }),
    ).toBe(false);
  });

  it('does NOT quit on another key, a key let go, or Ctrl+Q with another modifier', () => {
    expect(isQuitKey({ platform: 'linux', press: { ...CTRL_Q, key: 'w' } })).toBe(false);
    expect(isQuitKey({ platform: 'linux', press: { ...CTRL_Q, type: 'keyUp' } })).toBe(
      false,
    );
    expect(isQuitKey({ platform: 'linux', press: { ...CTRL_Q, shift: true } })).toBe(
      false,
    );
    expect(isQuitKey({ platform: 'linux', press: { ...CTRL_Q, alt: true } })).toBe(false);
    expect(isQuitKey({ platform: 'linux', press: { ...CTRL_Q, control: false } })).toBe(
      false,
    );
  });
});
