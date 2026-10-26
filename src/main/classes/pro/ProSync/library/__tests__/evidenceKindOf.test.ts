import { describe, expect, it } from 'vitest';
import { evidenceKindOf } from '@/main/classes/pro/ProSync/library';

describe('evidenceKindOf', () => {
  it('reads a screenshot and a video by their extension, in any case', () => {
    expect(evidenceKindOf('/data/2.JPG')).toEqual({
      kind: 'screenshot',
      contentType: 'image/jpeg',
    });
    expect(evidenceKindOf('/data/run.webm')).toEqual({
      kind: 'video',
      contentType: 'video/webm',
    });
  });

  it('reads the requests a run kept as its network', () => {
    expect(evidenceKindOf('/data/runs/w1/r1/network.json')).toEqual({
      kind: 'network',
      contentType: 'application/json',
    });
  });

  it('refuses a file QAzinho never sends', () => {
    expect(evidenceKindOf('/data/notes.txt')).toBeNull();
  });
});
