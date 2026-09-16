import type { PickKind } from '@/types';

/** The only caller of the file-picking side of the bridge. A page cannot open a dialog. */
export class Files {
  public static async pick(kind: PickKind): Promise<string | null> {
    return (await window.gocrash?.pickFile(kind)) ?? null;
  }
}
