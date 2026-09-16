import type { ISavedState } from '@/types';

/** A page with no bridge behind it reads an empty disk, never a half-read one. */
export const NOTHING_SAVED: ISavedState = { projects: '[]', workspaces: [] };
