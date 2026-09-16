import type { Language } from '@/languages/types';

/** A language names itself, so it is never translated. */
export const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'pt', label: 'Português' },
];
