/**
 * O nome com que um plano que não leu é guardado, ao lado do plano, carimbado para um
 * mais antigo nunca ser sobrescrito.
 */
export function asideNameOf(at: Date): string {
  const stamp = at.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');

  return `plan.unread-${stamp}.yaml`;
}
