import type { IJiraStory } from '@/shared/types';

/**
 * O que uma história pede, como texto que se compara de uma leitura a outra: a descrição
 * e os critérios de aceitação, sem o status, o responsável ou as etiquetas.
 */
export function storyTextOf(story: IJiraStory): string {
  return [
    story.summary.trim(),
    story.description.trim(),
    ...story.acceptance.map(({ field, text }) => `${field}:\n${text.trim()}`),
  ]
    .filter((part) => part !== '')
    .join('\n\n');
}
