import { describe, expect, it } from 'vitest';
import { closeMoveOf } from '@/main/library';

describe('closeMoveOf', () => {
  it('hides the window and keeps the app alive, like Discord', () => {
    expect(closeMoveOf({ isQuitting: false, isFullScreen: false })).toBe('hide');
  });

  it('really closes once the app is quitting, or quitting would hang on a hidden window', () => {
    expect(closeMoveOf({ isQuitting: true, isFullScreen: false })).toBe('close');
    expect(closeMoveOf({ isQuitting: true, isFullScreen: true })).toBe('close');
  });

  /** Esconder uma janela em tela cheia deixa no Mac um espaço preto onde ela estava. */
  it('leaves full screen before hiding', () => {
    expect(closeMoveOf({ isQuitting: false, isFullScreen: true })).toBe(
      'leave-full-screen',
    );
  });
});
