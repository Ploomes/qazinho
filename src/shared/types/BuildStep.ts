/** Where a build is: getting the code from GitHub, the agent building it, or QAzinho checking what it made. */
export type BuildStep = 'code' | 'agent' | 'artifact';
