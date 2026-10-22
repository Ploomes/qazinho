/** What a change to a suite is doing while it works: making its copy, the agent at work, or QAzinho running the test again. */
export type SuiteChangeStep = 'copy' | 'agent' | 'check';
