import type { IReleaseNote } from '@/modules/Help/types';
import { describe, expect, it } from 'vitest';
import { newsLinesOf, shippedNotesOf } from '@/modules/Help/library';

const notes = [
  { version: '0.16.0', date: '2026-11-15', notes: ['NEWS.B1', 'NEWS.B2'] },
  { version: '0.18.0', date: '2026-11-16', notes: ['NEWS.D1'] },
  { version: '0.17.0', date: '2026-11-15', notes: ['NEWS.C1'] },
  { version: '0.15.0', date: '2026-11-14', notes: [] },
  { version: '0.14.0', date: '2026-11-14', notes: ['NEWS.A1'] },
] as unknown as IReleaseNote[];

describe('shippedNotesOf', () => {
  /** Uma nota escrita antes da release aparecia num app que ainda não tinha a mudança. */
  it('leaves out a version newer than the app, newest first', () => {
    expect(
      shippedNotesOf({ notes, version: '0.17.0' }).map((note) => note.version),
    ).toEqual(['0.17.0', '0.16.0', '0.15.0', '0.14.0']);
  });
});

describe('newsLinesOf', () => {
  it('gives the headline of each of the newest versions', () => {
    expect(newsLinesOf({ notes, version: '0.18.0', count: 3 })).toEqual([
      { version: '0.18.0', date: '2026-11-16', noteKey: 'NEWS.D1' },
      { version: '0.17.0', date: '2026-11-15', noteKey: 'NEWS.C1' },
      { version: '0.16.0', date: '2026-11-15', noteKey: 'NEWS.B1' },
    ]);
  });

  it('skips a version with no note, and gives none for an app older than every note', () => {
    expect(
      newsLinesOf({ notes, version: '0.15.0', count: 3 }).map((line) => line.noteKey),
    ).toEqual(['NEWS.A1']);
    expect(newsLinesOf({ notes, version: '0.1.0', count: 3 })).toEqual([]);
  });
});
