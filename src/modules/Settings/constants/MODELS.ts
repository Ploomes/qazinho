import type { IModelOption } from '@/modules/Settings/types';

export const MODELS: Record<string, IModelOption[]> = {
  'Claude Code': [
    { id: 'haiku', name: 'Haiku', note: 'fastest', isLocked: false },
    { id: 'sonnet', name: 'Sonnet', note: 'the everyday one', isLocked: false },
    { id: 'opus', name: 'Opus', note: 'slower, more stubborn', isLocked: false },
    { id: 'fable', name: 'Fable', note: 'not on your key', isLocked: true },
  ],
  Codex: [
    { id: 'mini', name: 'Codex mini', note: 'fastest', isLocked: false },
    { id: 'codex', name: 'Codex', note: 'the everyday one', isLocked: false },
  ],
  'Gemini CLI': [],
};
