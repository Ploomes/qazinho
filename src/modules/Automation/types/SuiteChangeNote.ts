/**
 * Algo que o agente fez enquanto mudava uma suíte, como a página o guarda: uma linha que
 * disse ou fez, ou como foram os testes que rodou.
 */
export type SuiteChangeNote =
  | { id: number; kind: 'said'; text: string }
  | { id: number; kind: 'ran'; total: number; passed: number };
