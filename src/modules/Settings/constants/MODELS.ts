import type { IModelOption } from '@/modules/Settings/types';

export const MODELS: Record<string, IModelOption[]> = {
  'Claude Code': [
    { id: 'haiku', name: 'Haiku', noteKey: 'MODEL.NOTE_HAIKU', isLocked: false },
    { id: 'sonnet', name: 'Sonnet', noteKey: 'MODEL.NOTE_SONNET', isLocked: false },
    { id: 'opus', name: 'Opus', noteKey: 'MODEL.NOTE_OPUS', isLocked: false },
    { id: 'fable', name: 'Fable', noteKey: 'MODEL.NOTE_FABLE', isLocked: true },
  ],
};
