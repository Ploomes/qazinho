/** Where one install is. A tool with no state was never asked for. */
export type InstallState =
  | { phase: 'installing'; stage: number; stages: number; line: string }
  | { phase: 'installed' }
  | { phase: 'failed'; error: string; command: string; isFix: boolean };
