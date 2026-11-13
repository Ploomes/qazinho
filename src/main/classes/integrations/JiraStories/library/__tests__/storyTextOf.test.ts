import type { IJiraStory } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { storyTextOf } from '@/main/classes/integrations/JiraStories/library';

const STORY: IJiraStory = {
  key: 'SHOP-878',
  url: 'https://shop.atlassian.net/browse/SHOP-878',
  summary: 'Cupom no checkout',
  type: 'Story',
  status: 'In Progress',
  priority: 'High',
  labels: ['web'],
  components: [],
  parent: '',
  description: ' O cliente aplica um cupom. ',
  acceptance: [
    { field: 'Acceptance criteria', text: '- Bloquear depois de 3 tentativas' },
  ],
  comments: [],
  links: [],
  subtasks: [],
  attachments: [],
};

describe('storyTextOf', () => {
  it('keeps what the story asks for: the title, the description and the criteria', () => {
    expect(storyTextOf(STORY)).toBe(
      'Cupom no checkout\n\nO cliente aplica um cupom.\n\nAcceptance criteria:\n- Bloquear depois de 3 tentativas',
    );
  });

  /** Mover a história de coluna ou trocar o responsável não é uma mudança do plano. */
  it('reads the same when only the status, the priority or the labels change', () => {
    expect(
      storyTextOf({ ...STORY, status: 'Ready for QA', priority: 'Low', labels: [] }),
    ).toBe(storyTextOf(STORY));
  });
});
