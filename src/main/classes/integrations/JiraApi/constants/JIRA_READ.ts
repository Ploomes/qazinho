export const JIRA_READ = {
  acceptanceField: /acceptance|aceita[çc][ãa]o|aceite|crit[ée]rio/i,
  comments: 10,
  answerComments: 100,
  commentLength: 1_500,
  issueKey: /^[A-Z][A-Z0-9_]*-\d+$/i,
  timeoutMs: 20_000,
  downloadTimeoutMs: 120_000,
  pickerSize: 20,
} as const;
