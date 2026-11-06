const SKIPPED = new Set(['evidence_full', 'evidence_rejected']);

/**
 * Se a plataforma recusou só aquele arquivo, por falta de espaço na org ou por um tipo ou
 * tamanho que ela não guarda: o resto do projeto segue sem ele.
 */
export function isSkippedEvidence(error: string): boolean {
  return SKIPPED.has(error);
}
