// @vitest-environment jsdom
import type { ISaveSkill, ISkill, SkillSaved } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useSkillsSettingsViewModel } from '@/modules/Skills/components/SkillsSettings/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useSkillStore } from '@/store';

const skill = (props: Partial<ISkill>): ISkill => ({
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
  ...props,
});

const SKILLS = [
  skill({ id: 's2', name: 'zebra', isOn: false }),
  skill({}),
  skill({ id: 's3', name: 'alpha', use: 'called' }),
];

beforeEach(async () => {
  await i18n.changeLanguage('en');
  useSkillStore.setState({ skills: [], isLoaded: false });
  useAppStore.setState({ projects: [] });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listSkills: vi.fn().mockResolvedValue(SKILLS),
    refreshSkills: vi.fn().mockResolvedValue(SKILLS),
    saveSkill: vi.fn((input: ISaveSkill): Promise<SkillSaved> =>
      Promise.resolve({
        isSaved: true,
        skill: { ...skill({}), ...input, id: input.id ?? 's9' },
      }),
    ),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useSkillsSettingsViewModel', () => {
  it('reads the skills, then reads again the ones from outside, and shows on before off', async () => {
    const { result } = renderHook(() => useSkillsSettingsViewModel());

    await waitFor(() => {
      expect(window.qazinho.refreshSkills).toHaveBeenCalled();
    });

    expect(
      result.current.sections.map(({ title, rows }) => [
        title,
        rows.map(({ name }) => name),
      ]),
    ).toEqual([
      ['On', ['alpha', 'cases-gherkin']],
      ['Off', ['zebra']],
    ]);
    expect(result.current.sections[0]?.rows[0]).toMatchObject({
      facts: 'When I call it, All projects',
      source: 'Made here',
    });
  });

  it('turns a skill on or off in place', async () => {
    const { result } = renderHook(() => useSkillsSettingsViewModel());

    await waitFor(() => {
      expect(result.current.sections).toHaveLength(2);
    });
    await act(async () => {
      result.current.sections[1]?.rows[0]?.onToggle(true);
      await Promise.resolve();
    });

    expect(window.qazinho.saveSkill).toHaveBeenCalledWith(
      expect.objectContaining({ id: 's2', isOn: true }),
    );
  });

  it('says there is nothing yet only once it read an empty list', async () => {
    window.qazinho.listSkills = vi.fn().mockResolvedValue([]);
    window.qazinho.refreshSkills = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useSkillsSettingsViewModel());

    expect(result.current.isEmpty).toBe(false);

    await waitFor(() => {
      expect(result.current.isEmpty).toBe(true);
    });
  });

  it('opens the creator, the editor in blank or with a draft, and the import', () => {
    const { result } = renderHook(() => useSkillsSettingsViewModel());

    act(() => {
      result.current.onNew();
    });

    expect(result.current.isCreating).toBe(true);

    act(() => {
      result.current.onWrite();
    });

    expect(result.current).toMatchObject({
      isCreating: false,
      editing: { skill: null, draft: null },
    });

    act(() => {
      result.current.onCloseEditor();
      result.current.onDrafted({
        name: 'x',
        description: 'y',
        body: 'z',
        draftId: 'd1',
        files: [],
      });
    });

    expect(result.current.editing?.draft?.draftId).toBe('d1');

    act(() => {
      result.current.onImport();
    });

    expect(result.current.isImporting).toBe(true);
  });
});
