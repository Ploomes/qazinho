export const SUITE_RUNNER = {
  listFile: 'list.json',
  runFile: 'run.json',
  runs: 'runs',
  output: 'output',
  listTimeoutMs: 120_000,
  stopGraceMs: 4_000,
  saidChars: 1_200,
  env: {
    FORCE_COLOR: '0',
    PW_TEST_HTML_REPORT_OPEN: 'never',
  },
} as const;
