import type { ParseKeys } from 'i18next';

export const OPEN_LABELS: Record<'bug' | 'run', { doing: ParseKeys; done: ParseKeys }> = {
  bug: { doing: 'ASSISTANT.TOOL_OPEN_BUG', done: 'ASSISTANT.TOOL_OPEN_BUG_DONE' },
  run: { doing: 'ASSISTANT.TOOL_OPEN_RUN', done: 'ASSISTANT.TOOL_OPEN_RUN_DONE' },
};
