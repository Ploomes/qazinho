import type { IModelOption } from '@/modules/Settings/types';

export const MODELS: Record<string, IModelOption[]> = {
  'Claude Code': [
    { id: 'haiku', name: 'Haiku' },
    { id: 'sonnet', name: 'Sonnet' },
    { id: 'opus', name: 'Opus' },
    { id: 'fable', name: 'Fable' },
  ],
};
