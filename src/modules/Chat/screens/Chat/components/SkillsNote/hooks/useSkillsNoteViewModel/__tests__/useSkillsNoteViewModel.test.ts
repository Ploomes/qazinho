// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useSkillsNoteViewModel } from '@/modules/Chat/screens/Chat/components/SkillsNote/hooks/useSkillsNoteViewModel';

const textOf = (names: string[]) =>
  renderHook(() =>
    useSkillsNoteViewModel({
      message: { id: 'm-1', kind: 'skills', at: '10:30', names },
    }),
  ).result.current.text;

beforeEach(async () => {
  await i18n.changeLanguage('en');
});

describe('useSkillsNoteViewModel', () => {
  it('names the one skill the agent follows', () => {
    expect(textOf(['cases-gherkin'])).toBe('Following the cases-gherkin skill');
  });

  it('lists several skills the way the language joins them', async () => {
    expect(textOf(['cases-gherkin', 'edges', 'priority'])).toBe(
      'Following the cases-gherkin, edges, and priority skills',
    );

    await i18n.changeLanguage('pt');

    expect(textOf(['casos-gherkin', 'bordas'])).toBe(
      'Seguindo as skills casos-gherkin e bordas',
    );
  });
});
