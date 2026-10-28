/**
 * As palavras que o QAzinho acrescenta em volta da atualização do agente, no idioma que o
 * QA lê.
 */
export interface IBugUpdateWords {
  regression: string;
  seenAgain: string;
  runLine: (props: { run: string; when: string; caseId: string; step: number }) => string;
  attached: (files: string[]) => string;
}
