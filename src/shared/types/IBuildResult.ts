import type { BuildFailure } from './BuildFailure';

/** How a build ended: the .apk or .app QAzinho kept, with its size, commit and what the agent said it built, or why there is none. */
export type IBuildResult =
  | { isBuilt: true; artifact: string; bytes: number; commit: string; summary: string }
  | { isBuilt: false; failure: BuildFailure };
