import type { IHarnessSection } from '@/harness/context/types';
import type { IVariableBrief } from '@/shared/types';

/** The variables the project keeps, by name and what each holds, as a section the chat plans with; never a value. */
export function describeKeptVariables(variables: IVariableBrief[]): IHarnessSection {
  return {
    title: "The project's variables",
    lines:
      variables.length === 0
        ? ['The project keeps no variables yet.']
        : [
            'The project keeps these. A step names one as ${NAME}, and no one reads a value back:',
            ...variables.map(({ name, description }) =>
              description.length === 0
                ? `- \${${name}}`
                : `- \${${name}}: ${description}`,
            ),
          ],
  };
}
