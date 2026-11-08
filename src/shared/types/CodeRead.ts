/**
 * O código das gravações de um workspace como texto, para um agente de fora guardar onde
 * o QA quer, ou por que não há nenhum.
 */
export type CodeRead =
  | {
      kind: 'code';
      files: { name: string; content: string }[];
      samples: string[];
      exported: string[];
      missing: string[];
    }
  | { kind: 'nothing'; missing: string[] }
  | { kind: 'failed'; reason: 'app-id' };
