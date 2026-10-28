import type { IInstallStep } from '@/main/classes/setup/SetupInstaller/types';

/** A instalação como uma linha que o QA pode colar num terminal. */
export function commandLineOf(steps: IInstallStep[]): string {
  return steps.map((step) => [step.command, ...step.args].join(' ')).join(' && ');
}
