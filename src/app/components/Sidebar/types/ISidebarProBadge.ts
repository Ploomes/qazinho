/**
 * O vínculo de um projeto com a org dele no cabeçalho: o que ele diz, e quantos planos
 * esperam para ser enviados ou vieram da org.
 */
export interface ISidebarProBadge {
  label: string;
  tip: string;
  pending: number;
  updates: number;
  hasPending: boolean;
  hasUpdates: boolean;
  isShown: boolean;
}
