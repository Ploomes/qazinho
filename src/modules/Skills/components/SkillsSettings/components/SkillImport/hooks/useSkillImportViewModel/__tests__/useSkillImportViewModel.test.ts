// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useSkillImportViewModel } from '@/modules/Skills/components/SkillsSettings/components/SkillImport/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSetupStore, useSkillStore } from '@/store';

const REPOSITORY = {
  id: '1',
  owner: 'shop',
  name: 'qa',
  isPrivate: true,
  defaultBranch: 'main',
  pushedAt: null,
  description: 'Our automated tests',
};

const importer = () => {
  const onClose = vi.fn();

  return { ...renderHook(() => useSkillImportViewModel({ onClose })), onClose };
};

beforeEach(async () => {
  await i18n.changeLanguage('en');
  useSkillStore.setState({ skills: [], isLoaded: true });
  useSetupStore.setState({
    integrations: [{ id: 'github', account: 'qa', site: null, connectedAt: '' }],
  });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listRepositories: vi
      .fn()
      .mockResolvedValue({ isListed: true, repositories: [REPOSITORY] }),
    foundSkillsIn: vi.fn().mockResolvedValue({
      isFound: true,
      commit: 'c1',
      skills: [
        {
          name: 'cases-gherkin',
          description: 'When writing cases',
          path: 'cases',
          isKept: false,
        },
      ],
    }),
    foundSkills: vi.fn().mockResolvedValue([
      {
        name: 'edge',
        description: 'Limits',
        path: '/Users/qa/.claude/skills/edge',
        isKept: true,
      },
    ]),
    importSkills: vi.fn().mockResolvedValue([]),
    importSkillFile: vi.fn().mockResolvedValue([{ id: 's1' }]),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useSkillImportViewModel', () => {
  it('looks for skills in a folder of the team repository, and imports the chosen ones', async () => {
    const { result, onClose } = importer();

    await waitFor(() => {
      expect(result.current.search.items.map(({ id }) => id)).toEqual(['shop/qa']);
    });

    act(() => {
      result.current.onPickRepository('shop/qa');
    });

    expect(result.current).toMatchObject({
      picked: 'shop/qa',
      branch: 'main',
      folder: '.claude/skills',
    });

    await act(async () => {
      await result.current.onLook();
    });

    expect(window.qazinho.foundSkillsIn).toHaveBeenCalledWith({
      repository: 'shop/qa',
      branch: 'main',
      folder: '.claude/skills',
    });

    act(() => {
      result.current.skills[0]?.onChange(true);
    });

    expect(result.current).toMatchObject({
      canConfirm: true,
      confirmLabel: 'Import 1 skill',
    });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(window.qazinho.importSkills).toHaveBeenCalledWith({
      from: 'repo',
      repository: 'shop/qa',
      branch: 'main',
      folder: '.claude/skills',
      names: ['cases'],
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('asks to connect GitHub before looking in a repository', () => {
    useSetupStore.setState({ integrations: [] });

    expect(importer().result.current.githubNote).toBe(
      'Connect GitHub in Settings › Connections first.',
    );
  });

  it('lists the skills of this computer, marking the ones already here', async () => {
    const { result } = importer();

    act(() => {
      result.current.onFrom('computer');
    });

    await waitFor(() => {
      expect(result.current.skills).toEqual([
        expect.objectContaining({ name: 'edge', isKept: true, isOn: false }),
      ]);
    });

    act(() => {
      result.current.skills[0]?.onChange(true);
    });
    await act(async () => {
      await result.current.onConfirm();
    });

    expect(window.qazinho.importSkills).toHaveBeenCalledWith({
      from: 'computer',
      paths: ['/Users/qa/.claude/skills/edge'],
    });
  });

  it('brings a file in and closes once something came', async () => {
    const { result, onClose } = importer();

    act(() => {
      result.current.onFrom('file');
    });
    await act(async () => {
      await result.current.onPickFile();
    });

    expect(result.current.canConfirm).toBe(false);
    expect(onClose).toHaveBeenCalled();
  });
});
