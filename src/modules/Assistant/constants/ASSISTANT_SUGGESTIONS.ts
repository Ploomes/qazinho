import type { AssistantSuggestion } from '@/modules/Assistant/types';
import type { ParseKeys } from 'i18next';

export const ASSISTANT_SUGGESTIONS: Record<AssistantSuggestion, ParseKeys> = {
  abilities: 'ASSISTANT.SUGGEST_ABILITIES',
  lastRun: 'ASSISTANT.SUGGEST_LAST_RUN',
  summary: 'ASSISTANT.SUGGEST_SUMMARY',
  firstProject: 'ASSISTANT.SUGGEST_FIRST_PROJECT',
  newWorkspace: 'ASSISTANT.SUGGEST_NEW_WORKSPACE',
  theme: 'ASSISTANT.SUGGEST_THEME',
};
