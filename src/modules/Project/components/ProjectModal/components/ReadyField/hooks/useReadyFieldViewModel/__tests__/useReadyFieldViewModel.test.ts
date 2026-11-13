// @vitest-environment jsdom
import type { BoardColumnList, JiraBoardList } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useReadyFieldViewModel } from '@/modules/Project/components/ProjectModal/components/ReadyField/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';

const BOARDS: JiraBoardList = {
  isListed: true,
  boards: [
    { id: 7, name: 'Shop board', project: 'SHOP' },
    { id: 8, name: 'Ops board', project: 'OPS' },
  ],
};

const COLUMNS: BoardColumnList = {
  isListed: true,
  columns: [
    { name: 'To do', statuses: ['To Do'] },
    { name: 'Ready for QA', statuses: ['Ready for QA', 'In QA'] },
  ],
};

function jira(props: { boards?: JiraBoardList; columns?: BoardColumnList }) {
  const boards = vi.fn((_: string) => Promise.resolve(props.boards ?? BOARDS));

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listJiraBoards: boards,
    listBoardColumns: () => Promise.resolve(props.columns ?? COLUMNS),
  };

  return boards;
}

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

/**
 * O time diz "pronto para teste" por uma coluna do board, não por um status: o QA escolhe o
 * board e a coluna, e o QAzinho guarda os status que caem nela.
 */
describe('useReadyFieldViewModel', () => {
  it('picks a board, then a column, and hands back the statuses that fall in it', async () => {
    jira({});

    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useReadyFieldViewModel({ column: null, statuses: [], onChange }),
    );

    await waitFor(() => {
      expect(result.current.boardSearch.items.map(({ label }) => label)).toEqual([
        'Shop board',
        'Ops board',
      ]);
    });

    act(() => {
      result.current.onPickBoard('7');
    });

    await waitFor(() => {
      expect(result.current.columns.map(({ name }) => name)).toEqual([
        'To do',
        'Ready for QA',
      ]);
    });
    expect(result.current.columnsTitle).toBe('The column of Shop board');

    act(() => {
      result.current.columns[1]?.onPick();
    });

    expect(onChange).toHaveBeenCalledWith({
      column: { boardId: 7, board: 'Shop board', column: 'Ready for QA' },
      statuses: ['Ready for QA', 'In QA'],
    });
    expect(result.current.isPicking).toBe(false);
  });

  it('shows the column the project counts, with its statuses, and changes or drops it', async () => {
    const boards = jira({});
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useReadyFieldViewModel({
        column: { boardId: 7, board: 'Shop board', column: 'Ready for QA' },
        statuses: ['Ready for QA', 'In QA'],
        onChange,
      }),
    );

    expect(result.current).toMatchObject({
      isPicking: false,
      picked: {
        name: 'Shop board › Ready for QA',
        statuses: 'Statuses in it: Ready for QA and In QA',
      },
    });
    expect(boards).not.toHaveBeenCalled();

    act(() => {
      result.current.onChange();
    });

    await waitFor(() => {
      expect(result.current.hasBoardSearch).toBe(true);
    });

    act(() => {
      result.current.onClear();
    });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('searches the boards by the name the QA types', async () => {
    const boards = jira({});
    const { result } = renderHook(() =>
      useReadyFieldViewModel({ column: null, statuses: [], onChange: vi.fn() }),
    );

    act(() => {
      result.current.onQuery('Shop');
    });

    await waitFor(() => {
      expect(boards).toHaveBeenLastCalledWith('Shop');
    });
  });

  it('says why Jira did not list the boards', async () => {
    jira({ boards: { isListed: false, failure: 'unreachable' } });

    const { result } = renderHook(() =>
      useReadyFieldViewModel({ column: null, statuses: [], onChange: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.failure).toBe(
        'Jira is out of reach from this machine. Check the network.',
      );
    });
  });
});
