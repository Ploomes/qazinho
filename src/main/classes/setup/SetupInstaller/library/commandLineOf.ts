import type { IInstallStep } from '@/main/classes/setup/SetupInstaller/types';

/** The install as one line the QA can paste in a terminal. */
export function commandLineOf(steps: IInstallStep[]): string {
  return steps.map((step) => [step.command, ...step.args].join(' ')).join(' && ');
}
