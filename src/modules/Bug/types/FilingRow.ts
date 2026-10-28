import type { FilingStep } from '@/shared/types';

/**
 * Um passo que o popup lista enquanto um bug sai: a página preparando a evidência, depois
 * cada passo que a main dá.
 */
export type FilingRow = 'ready' | FilingStep;
