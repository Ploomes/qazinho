import type { Language } from '@/shared/types';

/** O que a máquina do QA pede, restrito ao que o QAzinho fala. O inglês é o fallback. */
export function resolveLanguage(locale: string | undefined): Language {
  return locale?.toLowerCase().startsWith('pt') === true ? 'pt' : 'en';
}
