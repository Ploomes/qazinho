import { describe, expect, it } from 'vitest';
import { byteRangeOf } from '@/main/classes/storage/ReplayServer/library';

describe('byteRangeOf', () => {
  it('sends the whole file when nothing is asked', () => {
    expect(byteRangeOf({ header: undefined, size: 1000 })).toEqual({ kind: 'whole' });
  });

  it('sends the slice a <video> asks for to seek', () => {
    expect(byteRangeOf({ header: 'bytes=100-199', size: 1000 })).toEqual({
      kind: 'slice',
      start: 100,
      end: 199,
    });
  });

  it('sends from a byte to the end when the end is left open, as a <video> first asks', () => {
    expect(byteRangeOf({ header: 'bytes=0-', size: 1000 })).toEqual({
      kind: 'slice',
      start: 0,
      end: 999,
    });
  });

  it('sends the last bytes asked by their count, where the MP4 index sits', () => {
    expect(byteRangeOf({ header: 'bytes=-300', size: 1000 })).toEqual({
      kind: 'slice',
      start: 700,
      end: 999,
    });
  });

  it('cuts an end past the file at its last byte', () => {
    expect(byteRangeOf({ header: 'bytes=900-5000', size: 1000 })).toEqual({
      kind: 'slice',
      start: 900,
      end: 999,
    });
  });

  it('says a slice that starts past the file is not in it', () => {
    expect(byteRangeOf({ header: 'bytes=1000-', size: 1000 })).toEqual({
      kind: 'outside',
    });
    expect(byteRangeOf({ header: 'bytes=-', size: 1000 })).toEqual({ kind: 'outside' });
  });

  it('sends the whole file for a range it cannot read, rather than nothing', () => {
    expect(byteRangeOf({ header: 'bytes=1-2,5-6', size: 1000 })).toEqual({
      kind: 'whole',
    });
  });
});
