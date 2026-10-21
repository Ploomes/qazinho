import type { IAgentLine } from '@/main/types';

const LONGEST = 160;

function shortened(text: string): string {
  const [first = ''] = text.trim().split('\n');

  return first.length > LONGEST ? `${first.slice(0, LONGEST - 1)}…` : first;
}

function nameOf(path: unknown): string {
  return typeof path === 'string' ? (path.split('/').at(-1) ?? path) : '';
}

/** What an assistant turn sets out to do, as a line each: a command it runs, a file it writes; reading leaves no line. */
export function toActions(line: IAgentLine): string[] {
  if (line.type !== 'assistant') return [];

  return (line.message?.content ?? []).flatMap((block) => {
    if (block.type !== 'tool_use') return [];

    const input = (block.input ?? {}) as { command?: unknown; file_path?: unknown };

    if (block.name === 'Bash' && typeof input.command === 'string')
      return [`$ ${shortened(input.command)}`];

    if (block.name === 'Edit' || block.name === 'Write')
      return [`✎ ${nameOf(input.file_path)}`];

    return [];
  });
}
