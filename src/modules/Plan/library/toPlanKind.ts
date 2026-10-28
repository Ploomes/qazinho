import type { TargetKind } from '@/modules/Project';

/**
 * Um plano é rascunhado para um tamanho de tela, não para um SO: Android e iOS leem
 * igual.
 */
export function toPlanKind(kind: TargetKind): 'web' | 'mobile' {
  return kind === 'web' ? 'web' : 'mobile';
}
