import type { IAgentLine } from '@/main/types';

const LONGEST = 160;

/**
 * O que um turno do assistente pretende fazer, uma linha cada: um comando que roda, um
 * arquivo que escreve; ler não deixa linha.
 */
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

function shortened(text: string): string {
  const [first = ''] = text.trim().split('\n');

  return first.length > LONGEST ? `${first.slice(0, LONGEST - 1)}…` : first;
}

function nameOf(path: unknown): string {
  return typeof path === 'string' ? (path.split(/[\\/]/).at(-1) ?? path) : '';
}
