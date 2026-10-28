/** As palavras em que o relatório de um bug é escrito, no idioma que o QA lê. */
export interface IBugReportWords {
  steps: string;
  expected: string;
  got: string;
  requests: string;
  where: string;
  app: string;
  target: string;
  run: string;
  runLine: (props: { run: string; when: string; caseId: string; step: number }) => string;
  seen: string;
  seenRuns: (count: number) => string;
  story: string;
  design: string;
  caughtBy: string;
  agentLine: (props: { agent: string; model: string | null }) => string;
  noAnswer: string;
  attached: (files: string[]) => string;
  foundWith: string;
}
