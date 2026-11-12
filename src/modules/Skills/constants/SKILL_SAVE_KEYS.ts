import type { ParseKeys } from 'i18next';

export const SKILL_SAVE_KEYS: Record<
  'no-name' | 'no-description' | 'no-body' | 'too-large' | 'taken',
  ParseKeys
> = {
  'no-name': 'SKILLS.NO_NAME',
  'no-description': 'SKILLS.NO_DESCRIPTION',
  'no-body': 'SKILLS.NO_BODY',
  'too-large': 'SKILLS.TOO_LARGE',
  taken: 'SKILLS.TAKEN',
};
