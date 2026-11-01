import type { ChatMessage } from '@/modules/Chat';
import type { SavedMessage } from '@/modules/Workspace/types';

const VERDICT_TEXT = /^Step (\d+) \S+ · ([\s\S]*)$/;

/**
 * Uma mensagem de chat salva lida de volta no formato de hoje, ou null para um tipo que o
 * chat não mostra mais.
 */
export function messageOfSaved(saved: SavedMessage): ChatMessage | null {
  if (saved.kind === 'action') return null;

  if (saved.kind === 'run') return { ...saved, endedBy: saved.endedBy ?? 'finished' };

  if (saved.kind === 'error')
    return { ...saved, runId: saved.runId ?? null, detail: saved.detail ?? null };

  if (saved.kind !== 'verdict') return saved;

  const { text, ...verdict } = saved;
  const read = VERDICT_TEXT.exec(text ?? '');

  return {
    ...verdict,
    runId: verdict.runId ?? null,
    stepNumber: verdict.stepNumber ?? Number(read?.[1] ?? 0),
    action: verdict.action ?? read?.[2] ?? text ?? '',
  };
}
