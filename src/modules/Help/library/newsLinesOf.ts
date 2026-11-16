import type { INewsLine, IReleaseNote } from '@/modules/Help/types';
import { shippedNotesOf } from './shippedNotesOf';

/** A manchete de cada uma das versões mais novas que o app traz, uma linha por versão. */
export function newsLinesOf(args: {
  notes: readonly IReleaseNote[];
  version: string;
  count: number;
}): INewsLine[] {
  return shippedNotesOf(args)
    .flatMap((release) => {
      const noteKey = release.notes[0];

      return noteKey === undefined
        ? []
        : [{ version: release.version, date: release.date, noteKey }];
    })
    .slice(0, args.count);
}
