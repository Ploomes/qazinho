/** The words QAzinho adds around the agent's update, in the language the QA reads. */
export interface IBugUpdateWords {
  regression: string;
  seenAgain: string;
  runLine: (props: { run: string; when: string; caseId: string; step: number }) => string;
  attached: (files: string[]) => string;
}
