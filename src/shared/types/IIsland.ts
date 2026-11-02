import type { IslandState } from './IslandState';
import type { Language } from './Language';

/** O que a página manda à ilha: o que mostrar, no idioma do QA. */
export interface IIsland {
  language: Language;
  state: IslandState;
}
