/**
 * Como terminou exportar os casos gravados como código: salvo onde o QA escolheu, nada
 * gravado ainda, cancelado, ou falhou com o porquê.
 */
export type ExportOutcome =
  | {
      kind: 'saved';
      folder: string;
      files: string[];
      exported: string[];
      missing: string[];
    }
  | { kind: 'nothing'; missing: string[] }
  | { kind: 'cancelled' }
  | { kind: 'failed'; reason: 'app-id' | 'write' };
