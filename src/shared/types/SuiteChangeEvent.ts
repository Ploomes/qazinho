import type { ISuiteChange } from './ISuiteChange';

/**
 * O que chega à página enquanto o agente muda uma suíte: a mudança como está agora, uma
 * linha do que o agente diz e faz, ou como foram os testes que ele rodou.
 */
export type SuiteChangeEvent =
  | { kind: 'changed'; change: ISuiteChange }
  | { kind: 'line'; projectId: string; changeId: string; text: string }
  | { kind: 'ran'; projectId: string; changeId: string; total: number; passed: number };
