// @vitest-environment jsdom
import type { INamedMessage } from '@/modules/Chat/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useNamedNoteViewModel } from '@/modules/Chat/screens/Chat/components/NamedNote/hooks/useNamedNoteViewModel';
import { useAppStore } from '@/store';

const MESSAGE: INamedMessage = {
  id: 'm-2',
  kind: 'named',
  at: '10:30',
  projectId: 'p-1',
  name: 'Loja Online',
  from: 'site',
};

const view = (message: INamedMessage = MESSAGE) =>
  renderHook(() => useNamedNoteViewModel({ message }));

beforeEach(async () => {
  await i18n.changeLanguage('en');
  useAppStore.setState({
    projects: [{ id: 'p-1', name: 'Loja Online', targets: [], repositories: [] }],
    modal: null,
    editingProjectId: null,
    projectSection: null,
  });
});

afterEach(() => {
  cleanup();
});

describe('useNamedNoteViewModel', () => {
  it('says where the name came from', () => {
    expect(view().result.current).toMatchObject({
      textKey: 'CHAT.NAMED_SITE',
      name: 'Loja Online',
    });
    expect(view({ ...MESSAGE, from: 'agent' }).result.current.textKey).toBe(
      'CHAT.NAMED_AGENT',
    );
  });

  it('opens the name of the project to change it', () => {
    const { result } = view();

    act(() => {
      result.current.onRename();
    });

    expect(useAppStore.getState()).toMatchObject({
      modal: 'project',
      editingProjectId: 'p-1',
      projectSection: 'general',
    });
  });

  it('does NOT offer to change the name of a project that is gone', () => {
    useAppStore.setState({ projects: [] });

    expect(view().result.current.canRename).toBe(false);
  });
});
