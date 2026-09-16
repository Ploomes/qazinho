import type { Language } from '@/languages/types';

/** A language names itself, so it is never translated. */
export const LANGUAGES: { id: Language; label: string; code: string }[] = [
  { id: 'en', label: 'English', code: 'en-US' },
  { id: 'pt', label: 'Português', code: 'pt-BR' },
];
