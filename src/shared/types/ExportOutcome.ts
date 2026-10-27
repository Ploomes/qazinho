/**
 * How exporting the recorded cases as code ended: saved where the QA picked, nothing
 * recorded yet, called off, or failed with why.
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
