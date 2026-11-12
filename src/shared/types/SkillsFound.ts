import type { ISkillFound } from './ISkillFound';

/**
 * O que uma busca por skills achou, e de qual commit, ou por que não deu: sem o gh, a
 * pasta vazia, ou o GitHub recusou.
 */
export type SkillsFound =
  | { isFound: true; skills: ISkillFound[]; commit: string | null }
  | { isFound: false; reason: 'no-cli' | 'refused' | 'empty'; said: string };
