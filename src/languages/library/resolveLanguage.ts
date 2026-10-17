import type { Language } from '@/languages/types';

/** What the QA's machine asks for, narrowed to what QAzinho speaks. English is the fallback. */
export function resolveLanguage(locale: string | undefined): Language {
  return locale?.toLowerCase().startsWith('pt') === true ? 'pt' : 'en';
}
