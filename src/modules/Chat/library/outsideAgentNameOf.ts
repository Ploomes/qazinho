import type { OutsideCaller } from '@/shared/types';

const NAMES: Record<OutsideCaller, string | null> = {
  'claude-code': 'Claude Code',
  codex: 'Codex',
  other: null,
};

/** O nome do agente de código que escreveu de fora, ou null quando ele não se nomeou. */
export function outsideAgentNameOf(caller: OutsideCaller | undefined): string | null {
  return NAMES[caller ?? 'other'];
}
