import type { IHarnessSection } from '@/main/classes/agents/Harness/types';

/** The system prompt as the agent reads it: titled blocks, in the order given. */
export function renderSections(sections: IHarnessSection[]): string {
  return sections
    .filter((section) => section.lines.length > 0)
    .map((section) => `## ${section.title}\n${section.lines.join('\n')}`)
    .join('\n\n');
}
