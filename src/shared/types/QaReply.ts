/** The QA's reply to a run's question: their words, or a secret the agent types by its name, kept in the project's variables when they say so. */
export type QaReply =
  { kind: 'said'; text: string } | { kind: 'secret'; value: string; isKept: boolean };
