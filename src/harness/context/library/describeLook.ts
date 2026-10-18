import type { IHarnessSection } from '@/harness/context/types';
import type { AppLook } from '@/harness/types';

/** What QAzinho saw of the app before the message, as a section the agent asks from; nothing when it did not look. */
export function describeLook(look: AppLook | null): IHarnessSection {
  const title = 'What QAzinho saw of the app';

  if (look === null) return { title, lines: [] };

  return {
    title,
    lines: look.isOpen
      ? [
          `QAzinho opened ${look.url} in a browser before this message, and the pages its menu leads to. They read:`,
          ...look.page.split('\n'),
        ]
      : [
          `QAzinho tried to open ${look.url} before this message and could not: ${look.reason}`,
        ],
  };
}
