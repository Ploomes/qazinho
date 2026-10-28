import type { BuildFailure } from './BuildFailure';

/**
 * Como um build terminou: o .apk ou .app que o QAzinho guardou, com o tamanho, o commit e
 * o que o agente disse que construiu, ou por que não há.
 */
export type IBuildResult =
  | { isBuilt: true; artifact: string; bytes: number; commit: string; summary: string }
  | { isBuilt: false; failure: BuildFailure };
