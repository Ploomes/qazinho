import type { IAgentLine } from '@/main/types';

/** An assistant turn is a list of blocks; only the text ones are for the QA to read. */
export function toText(line: IAgentLine): string {
  if (line.type !== 'assistant') return '';

  return (line.message?.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
    .trim();
}
