// @vitest-environment jsdom
import type { IProject } from '@/modules/Project/types';
import type { ISaveSkill, ISkill, SkillSaved } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useSkillEditorViewModel } from '@/modules/Skills/components/SkillsSettings/components/SkillEditor/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSkillStore } from '@/store';

const SKILL: ISkill = {
  id: 's1',
  name: 'cases-gherkin',
  description: 'When writing cases',
  body: 'Gherkin.',
  files: ['model.md'],
  use: 'cases',
  projectIds: null,
  isOn: true,
  source: { kind: 'created' },
  updatedAt: '',
};
const PROJECTS = [
  { id: 'p1', name: 'Shop' },
  { id: 'p2', name: 'Blog' },
] as IProject[];

const editor = (props: { skill: ISkill | null; draftId?: string }) => {
  const onClose = vi.fn();
  const rendered = renderHook(() =>
    useSkillEditorViewModel({
      editing: {
        skill: props.skill,
        draft:
          props.draftId === undefined
            ? null
            : {
                name: 'drafted',
                description: 'From the agent',
                body: 'Body.',
                draftId: props.draftId,
                files: [],
              },
      },
      projects: PROJECTS,
      onClose,
    }),
  );

  return { ...rendered, onClose };
};

beforeEach(async () => {
  await i18n.changeLanguage('en');
  useSkillStore.setState({ skills: [], isLoaded: true });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    saveSkill: vi.fn((input: ISaveSkill): Promise<SkillSaved> =>
      Promise.resolve({ isSaved: true, skill: { ...SKILL, ...input, id: 's9' } }),
    ),
    removeSkill: vi.fn().mockResolvedValue(undefined),
    exportSkill: vi.fn().mockResolvedValue('/Users/qa/skills/cases-gherkin'),
    dropSkillDraft: vi.fn().mockResolvedValue(undefined),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useSkillEditorViewModel', () => {
  it('saves a skill written from the agent draft, on, with the draft files', async () => {
    const { result, onClose } = editor({ skill: null, draftId: 'd1' });

    expect(result.current).toMatchObject({
      title: 'New skill',
      name: 'drafted',
      canSave: true,
    });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(window.qazinho.saveSkill).toHaveBeenCalledWith(
      expect.objectContaining({ id: null, name: 'drafted', isOn: true, draftId: 'd1' }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('says why it did NOT save, and keeps the editor open', async () => {
    window.qazinho.saveSkill = vi
      .fn()
      .mockResolvedValue({ isSaved: false, reason: 'taken' });
    const { result, onClose } = editor({ skill: SKILL });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(result.current.error).toBe('Another skill already has this name.');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does NOT let an empty skill be saved', () => {
    const { result } = editor({ skill: null });

    expect(result.current.canSave).toBe(false);

    act(() => {
      result.current.onName('edge');
      result.current.onDescription('When writing cases');
      result.current.onBody({ target: { value: 'Limits.' } } as never);
    });

    expect(result.current.canSave).toBe(true);
  });

  it('keeps a skill from a repository read-only, says where to edit it, and offers a copy', () => {
    const { result } = editor({
      skill: {
        ...SKILL,
        source: {
          kind: 'repo',
          repository: 'shop/qa',
          branch: 'main',
          folder: 'x',
          commit: 'c',
        },
      },
    });

    expect(result.current).toMatchObject({
      isOwn: false,
      canSave: true,
      canDuplicate: true,
      note: 'shop/qa keeps this skill: edit it there, and QAzinho reads it again when the branch moves.',
    });
  });

  it('picks only some projects, and every project again', async () => {
    const { result } = editor({ skill: SKILL });

    act(() => {
      result.current.onReach('some');
    });
    act(() => {
      result.current.projects[0]?.onChange(true);
    });

    expect(result.current.projects.map(({ isOn }) => isOn)).toEqual([true, false]);

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(window.qazinho.saveSkill).toHaveBeenCalledWith(
      expect.objectContaining({ projectIds: ['p1'] }),
    );

    act(() => {
      result.current.onReach('all');
    });

    expect(result.current.isPicking).toBe(false);
  });

  it('exports, deletes, and drops the draft of a skill never saved', async () => {
    const { result, onClose } = editor({ skill: SKILL });

    expect(result.current.filesLabel).toBe('Files: model.md');

    await act(async () => {
      await result.current.onExport();
    });

    expect(result.current.exported).toBe('Exported to /Users/qa/skills/cases-gherkin');

    await act(async () => {
      await result.current.onDelete();
    });

    expect(window.qazinho.removeSkill).toHaveBeenCalledWith('s1');
    expect(onClose).toHaveBeenCalled();

    const drafted = editor({ skill: null, draftId: 'd2' });

    act(() => {
      drafted.result.current.onCancel();
    });

    expect(window.qazinho.dropSkillDraft).toHaveBeenCalledWith('d2');
  });

  describe('the tabs of a new skill', () => {
    const blank = (onWithAgent?: () => void) =>
      renderHook(() =>
        useSkillEditorViewModel({
          editing: { skill: null, draft: null },
          projects: PROJECTS,
          onClose: vi.fn(),
          ...(onWithAgent === undefined ? {} : { onWithAgent }),
        }),
      );

    it('keeps the tabs on a blank new skill, so the QA goes back to the agent', () => {
      const onWithAgent = vi.fn();
      const { result } = blank(onWithAgent);

      expect(result.current.hasModes).toBe(true);

      act(() => {
        result.current.onMode('hand');
      });

      expect(onWithAgent).not.toHaveBeenCalled();

      act(() => {
        result.current.onMode('agent');
      });

      expect(onWithAgent).toHaveBeenCalledOnce();
    });

    it('does NOT show the tabs on a saved skill or a draft the agent wrote', () => {
      expect(editor({ skill: SKILL }).result.current.hasModes).toBe(false);
      expect(editor({ skill: null, draftId: 'd1' }).result.current.hasModes).toBe(false);
      expect(blank().result.current.hasModes).toBe(false);
    });
  });
});
