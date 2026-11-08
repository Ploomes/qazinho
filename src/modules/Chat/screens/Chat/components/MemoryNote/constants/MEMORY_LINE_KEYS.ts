import type { IMemoryChange } from '@/modules/Memory/types';

export const MEMORY_LINE_KEYS = {
  added: 'CHAT.MEMORY_ADDED',
  replaced: 'CHAT.MEMORY_REPLACED',
  forgotten: 'CHAT.MEMORY_FORGOTTEN',
} as const satisfies Record<IMemoryChange['kind'], string>;
