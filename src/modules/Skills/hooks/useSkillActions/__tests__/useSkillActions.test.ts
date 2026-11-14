// @vitest-environment jsdom
import type { ISkill } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSkillActions } from '@/modules/Skills/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSkillStore } from '@/store';

const SKILL: ISkill = {
  id: 's1',
  name: 'cases-gherkin',
  description: 'When writing cases',
  body: 'Gherkin.',
  files: [],
  use: 'cases',
  projectIds: null,
  isOn: true,
  source: { kind: 'created' },
  updatedAt: '',
};

beforeEach(() => {
  useSkillStore.setState({ skills: [], isLoaded: false });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listSkills: vi.fn().mockResolvedValue([SKILL]),
    saveSkill: vi
      .fn()
      .mockResolvedValue({ isSaved: true, skill: { ...SKILL, isOn: false } }),
    removeSkill: vi.fn().mockResolvedValue(undefined),
    importSkills: vi.fn().mockResolvedValue([{ ...SKILL, id: 's2', name: 'edge-cases' }]),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useSkillActions', () => {
  it('loads the skills, then keeps what a save, an import and a removal change', async () => {
    const { result } = renderHook(() => useSkillActions());

    await act(async () => {
      await result.current.load();
    });

    expect(useSkillStore.getState()).toMatchObject({ isLoaded: true, skills: [SKILL] });

    await act(async () => {
      await result.current.save({ ...SKILL, isOn: false, draftId: null });
      await result.current.importSkills({ from: 'computer', paths: ['/x'] });
    });

    expect(useSkillStore.getState().skills.map(({ id, isOn }) => [id, isOn])).toEqual([
      ['s1', false],
      ['s2', true],
    ]);

    await act(async () => {
      await result.current.remove('s1');
    });

    expect(useSkillStore.getState().skills.map(({ id }) => id)).toEqual(['s2']);
  });

  it('does NOT keep a skill the main refused to save', async () => {
    window.qazinho.saveSkill = vi
      .fn()
      .mockResolvedValue({ isSaved: false, reason: 'taken' });
    const { result } = renderHook(() => useSkillActions());
    let saved: Awaited<ReturnType<typeof result.current.save>> | null = null;

    await act(async () => {
      saved = await result.current.save({ ...SKILL, id: null, draftId: null });
    });

    expect(saved).toEqual({ isSaved: false, reason: 'taken' });
    expect(useSkillStore.getState().skills).toEqual([]);
  });
});
