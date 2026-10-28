import type { IAgentLine } from '@/main/types';

/** Um turno do assistente é uma lista de blocos; só os de texto são para o QA ler. */
export function toText(line: IAgentLine): string {
  if (line.type !== 'assistant') return '';

  return (line.message?.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
    .trim();
}
