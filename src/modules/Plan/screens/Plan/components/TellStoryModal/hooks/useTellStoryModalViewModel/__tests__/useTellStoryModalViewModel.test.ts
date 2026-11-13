// @vitest-environment jsdom
import type { BugComment, ITellStory } from '@/shared/types';
import type { ChangeEvent } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTellStoryModalViewModel } from '@/modules/Plan/screens/Plan/components/TellStoryModal/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

function jira(posted: BugComment) {
  const tell = vi.fn((_: ITellStory) => Promise.resolve(posted));

  window.qazinho = { ...fakeQazinhoApi('darwin'), tellStory: tell };

  return tell;
}

const typed = (value: string) =>
  ({ target: { value } }) as unknown as ChangeEvent<HTMLTextAreaElement>;

function render() {
  const onPosted = vi.fn();
  const view = renderHook(() =>
    useTellStoryModalViewModel({
      storyKey: 'SHOP-878',
      note: 'Atualizei o plano.\n- TC-04: 5 tentativas',
      onCancel: vi.fn(),
      onPosted,
    }),
  );

  return { onPosted, view };
}

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

/** Nada vai ao Jira sem o clique do QA, e ele pode mudar as palavras antes. */
describe('useTellStoryModalViewModel', () => {
  it('posts the comment as the QA left it, and says where it went', async () => {
    const tell = jira({
      isPosted: true,
      url: 'https://shop.atlassian.net/browse/SHOP-878',
      missed: [],
    });
    const { onPosted, view } = render();

    expect(view.result.current.text).toBe('Atualizei o plano.\n- TC-04: 5 tentativas');

    act(() => {
      view.result.current.onText(typed('Plano atualizado.'));
    });
    act(() => {
      view.result.current.onConfirm();
    });

    await waitFor(() => {
      expect(onPosted).toHaveBeenCalledWith('https://shop.atlassian.net/browse/SHOP-878');
    });
    expect(tell).toHaveBeenCalledWith({ key: 'SHOP-878', text: 'Plano atualizado.' });
  });

  it('says why Jira refused, and keeps the window', async () => {
    jira({ isPosted: false, failure: 'rejected', said: 'Comments are closed.' });
    const { onPosted, view } = render();

    act(() => {
      view.result.current.onConfirm();
    });

    await waitFor(() => {
      expect(view.result.current.hint).toBe('Comments are closed.');
    });
    expect(onPosted).not.toHaveBeenCalled();
  });

  it('does NOT post an empty comment', () => {
    const tell = jira({ isPosted: true, url: '', missed: [] });
    const { view } = render();

    act(() => {
      view.result.current.onText(typed('  '));
    });
    act(() => {
      view.result.current.onConfirm();
    });

    expect(view.result.current.canConfirm).toBe(false);
    expect(tell).not.toHaveBeenCalled();
  });
});
