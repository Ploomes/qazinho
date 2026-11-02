import type { IModelOption } from '@/modules/Settings/types';

export const MODELS: Record<string, IModelOption[]> = {
  'Claude Code': [
    { id: 'haiku', name: 'Haiku', isLocked: false },
    { id: 'sonnet', name: 'Sonnet', isLocked: false },
    { id: 'opus', name: 'Opus', isLocked: false },
    { id: 'fable', name: 'Fable', isLocked: true },
  ],
};
