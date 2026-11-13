import type { ProjectPick } from '@/modules/Home/types';
import { PROJECT_PICKS } from '@/modules/Home/constants';

/**
 * Os cartões marcados depois de um toque, na ordem da tela; "nada" não se mistura com os
 * outros, e marcar um tira o outro.
 */
export function withPick(props: {
  picks: ProjectPick[];
  pick: ProjectPick;
}): ProjectPick[] {
  const { picks, pick } = props;

  if (pick === 'none') return picks.includes('none') ? [] : ['none'];

  const kept = picks.filter((one) => one !== 'none');
  const next = kept.includes(pick) ? kept.filter((one) => one !== pick) : [...kept, pick];

  return PROJECT_PICKS.map(({ id }) => id).filter((id) => next.includes(id));
}
