import type { ICodeSource, ISourceChange, ISourceSnapshot } from '@/shared/types';

/**
 * O que a conferência das fontes achou e o QA ainda não resolveu: as mudanças, e como as
 * fontes estão agora, que viram o novo retrato quando ele resolve.
 */
export interface IPendingChange {
  found: ISourceChange[];
  snapshots: ISourceSnapshot[];
  code: ICodeSource | null;
  at: string;
}
