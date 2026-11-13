// @vitest-environment jsdom
import type { ISkill } from '@/shared/types';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSkills } from '@/modules/Skills/hooks/useSkills';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSkillStore } from '@/store';

const SKILL: ISkill = {
  id: 's1',
  name: 'edges',
  description: 'Limits, empty fields and permissions',
  body: 'Every field gets a limit case.',
  files: [],
  use: 'called',
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
    refreshSkills: vi.fn().mockResolvedValue([]),
  };
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useSkills', () => {
  it('reads the skills kept on this computer when QAzinho opens', async () => {
    renderHook(() => {
      useSkills();
    });

    await waitFor(() => {
      expect(useSkillStore.getState()).toMatchObject({ skills: [SKILL], isLoaded: true });
    });
  });

  it('does NOT read the repositories again on its own', async () => {
    renderHook(() => {
      useSkills();
    });

    await waitFor(() => {
      expect(useSkillStore.getState().isLoaded).toBe(true);
    });

    expect(window.qazinho.refreshSkills).not.toHaveBeenCalled();
  });
});
