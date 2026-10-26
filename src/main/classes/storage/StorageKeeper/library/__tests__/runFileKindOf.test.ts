import { describe, expect, it } from 'vitest';
import { runFileKindOf } from '@/main/classes/storage/StorageKeeper/library';

describe('runFileKindOf', () => {
  it("knows a run's video by its name, from the recorder, a simulator or an emulator", () => {
    expect(runFileKindOf('run.mp4')).toBe('video');
    expect(runFileKindOf('run.webm')).toBe('video');
  });

  it('knows a screen by its extension, whatever its case', () => {
    expect(runFileKindOf('step-1.jpg')).toBe('screen');
    expect(runFileKindOf('finding-3-1.JPEG')).toBe('screen');
    expect(runFileKindOf('screen-2.png')).toBe('screen');
  });

  it('calls nothing else a video or a screen', () => {
    expect(runFileKindOf('network.json')).toBeNull();
    expect(runFileKindOf('clip.mp4')).toBeNull();
    expect(runFileKindOf('video-removed.json')).toBeNull();
  });
});
