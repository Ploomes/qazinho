// @vitest-environment jsdom
import type { IStoryDoubtsPost, StoryDoubtsPosted, StoryPeople } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDoubtsModalViewModel } from '@/modules/Plan/screens/Plan/components/DoubtsModal/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

const DOUBTS = [
  { id: 'D2', question: 'Does a coupon stack?', sent: null, answer: null },
  { id: 'D3', question: 'Which error shows?', sent: null, answer: null },
];

function jira(props: { people: StoryPeople; posted?: StoryDoubtsPosted }) {
  const askStory = vi.fn((_: IStoryDoubtsPost) =>
    Promise.resolve(
      props.posted ?? {
        isPosted: true as const,
        url: 'https://shop.atlassian.net/browse/SHOP-878?focusedCommentId=100',
        at: '2026-11-13T13:00:00.000Z',
        mentioned: 'Rui PO',
      },
    ),
  );

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    readStoryPeople: () => Promise.resolve(props.people),
    askStory,
  };

  return askStory;
}

function render() {
  const onPosted = vi.fn();
  const onCancel = vi.fn();
  const view = renderHook(() =>
    useDoubtsModalViewModel({ storyKey: 'SHOP-878', doubts: DOUBTS, onCancel, onPosted }),
  );

  return { onPosted, onCancel, view };
}

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

/**
 * O comentário sai do Jira do próprio QA, só com o clique dele: ele vê o que vai, muda as
 * palavras se quiser, e decide se acompanha a história.
 */
describe('useDoubtsModalViewModel', () => {
  it('names who the comment mentions, and offers to follow the story', async () => {
    jira({ people: { isRead: true, reporter: 'Rui PO', isWatching: false } });
    const { view } = render();

    await waitFor(() => {
      expect(view.result.current.mention).toBe('Mentions Rui PO, who wrote the story');
    });
    expect(view.result.current).toMatchObject({
      title: 'Ask on SHOP-878',
      isWatching: false,
      wantsToWatch: true,
      closing: 'Answer naming the doubt, like D2, and the test plan moves on.',
    });
  });

  it('posts the doubts as the QA wrote them, and hands back where they went', async () => {
    const askStory = jira({
      people: { isRead: true, reporter: 'Rui PO', isWatching: false },
    });
    const { onPosted, view } = render();

    act(() => {
      view.result.current.onQuestion({
        id: 'D3',
        value: 'Which error shows for an expired coupon?',
      });
    });
    act(() => {
      view.result.current.onConfirm();
    });

    await waitFor(() => {
      expect(onPosted).toHaveBeenCalledWith({
        sent: {
          url: 'https://shop.atlassian.net/browse/SHOP-878?focusedCommentId=100',
          at: '2026-11-13T13:00:00.000Z',
        },
        questions: [
          { id: 'D2', question: 'Does a coupon stack?' },
          { id: 'D3', question: 'Which error shows for an expired coupon?' },
        ],
      });
    });
    expect(askStory).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'SHOP-878', isWatching: true }),
    );
  });

  it('does NOT ask Jira to follow a story the QA already follows, or chose not to', async () => {
    const askStory = jira({ people: { isRead: true, reporter: null, isWatching: true } });
    const { view } = render();

    await waitFor(() => {
      expect(view.result.current.isWatching).toBe(true);
    });
    expect(view.result.current.mention).toBeNull();

    act(() => {
      view.result.current.onConfirm();
    });

    await waitFor(() => {
      expect(askStory).toHaveBeenCalledWith(
        expect.objectContaining({ isWatching: false }),
      );
    });
  });

  it('says why Jira refused, in its words, and keeps the window open', async () => {
    jira({
      people: { isRead: false, failure: 'unreachable' },
      posted: { isPosted: false, failure: 'rejected', said: 'Comments are closed.' },
    });
    const { onPosted, view } = render();

    act(() => {
      view.result.current.onConfirm();
    });

    await waitFor(() => {
      expect(view.result.current.hint).toBe('Comments are closed.');
    });
    expect(onPosted).not.toHaveBeenCalled();
    expect(view.result.current.canConfirm).toBe(true);
  });

  it('does NOT post a doubt the QA emptied', () => {
    const askStory = jira({
      people: { isRead: true, reporter: null, isWatching: false },
    });
    const { view } = render();

    act(() => {
      view.result.current.onQuestion({ id: 'D2', value: '  ' });
    });
    act(() => {
      view.result.current.onConfirm();
    });

    expect(view.result.current.canConfirm).toBe(false);
    expect(askStory).not.toHaveBeenCalled();
  });
});
