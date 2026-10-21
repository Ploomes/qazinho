import { describe, expect, it } from 'vitest';
import { REPLAY_COMPOSER } from '@/modules/Run/classes/video/ReplayComposer/constants';

describe('REPLAY_COMPOSER', () => {
  it('encodes H.264 in the recorder’s profile first, then a level that takes taller frames', () => {
    expect(REPLAY_COMPOSER.codecs[0]).toBe('avc1.640028');
    expect(REPLAY_COMPOSER.codecs.every((codec) => codec.startsWith('avc1.64'))).toBe(
      true,
    );
  });

  it('holds a picture once a frame of its own rate', () => {
    expect(REPLAY_COMPOSER.stepUs).toBe(1_000_000 / REPLAY_COMPOSER.frameRate);
  });

  it('puts a key frame every few steps, so the video seeks', () => {
    expect(REPLAY_COMPOSER.keyEveryUs % REPLAY_COMPOSER.stepUs).toBe(0);
    expect(REPLAY_COMPOSER.keyEveryUs / REPLAY_COMPOSER.stepUs).toBeLessThanOrEqual(30);
  });

  it('tries the hardware first, and the machine’s own choice after', () => {
    expect(REPLAY_COMPOSER.acceleration).toEqual(['prefer-hardware', 'no-preference']);
  });
});
