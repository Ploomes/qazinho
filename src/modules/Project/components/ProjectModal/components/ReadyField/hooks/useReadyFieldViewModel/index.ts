import type { IReadyFieldProps } from '@/modules/Project/components/ProjectModal/components/ReadyField/types';
import type { BoardColumnList, IJiraBoard, JiraBoardList } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { JIRA_FAILURE_KEYS } from '@/modules/Setup/constants';
import { Jira } from '@/services';

export const useReadyFieldViewModel = (props: IReadyFieldProps) => {
  const { column, statuses, onChange } = props;
  const { t, i18n } = useTranslation();
  const [isPicking, setPicking] = useState(column === null);
  const [query, setQuery] = useState('');
  const [boards, setBoards] = useState<JiraBoardList | null>(null);
  const [board, setBoard] = useState<IJiraBoard | null>(null);
  const [columns, setColumns] = useState<BoardColumnList | null>(null);

  useEffect(() => {
    if (!isPicking) return;

    let isLive = true;

    void Jira.boards(query).then((read) => {
      if (isLive) setBoards(read);
    });

    return () => {
      isLive = false;
    };
  }, [isPicking, query]);

  useEffect(() => {
    if (board === null) return;

    let isLive = true;

    void Jira.columns(board.id).then((read) => {
      if (isLive) setColumns(read);
    });

    return () => {
      isLive = false;
    };
  }, [board]);

  const listOf = (names: string[]) =>
    new Intl.ListFormat(i18n.language, { style: 'long', type: 'conjunction' }).format(
      names,
    );
  const failed =
    columns?.isListed === false
      ? columns.failure
      : boards?.isListed === false
        ? boards.failure
        : null;

  return {
    label: t('PROJECT.READY'),
    note: t('PROJECT.READY_NOTE'),
    isPicking,
    picked:
      column === null
        ? null
        : {
            name: t('PROJECT.READY_PICKED', {
              board: column.board,
              column: column.column,
            }),
            statuses:
              statuses.length === 0
                ? ''
                : t('PROJECT.READY_STATUSES', { statuses: listOf(statuses) }),
          },
    changeLabel: t('PROJECT.READY_CHANGE'),
    clearLabel: t('PROJECT.READY_CLEAR'),
    isLoading: isPicking && boards === null,
    loadingText: t('PROJECT.READY_LOADING'),
    failure: failed === null ? null : t(JIRA_FAILURE_KEYS[failed]),
    hasBoardSearch: isPicking && board === null,
    boardSearch: {
      query,
      label: t('PROJECT.READY_BOARD'),
      placeholder: t('PROJECT.READY_BOARD_PLACEHOLDER'),
      items: (boards?.isListed === true ? boards.boards : []).map((one) => ({
        id: String(one.id),
        label: one.name,
        tag: one.project === '' ? null : one.project,
        detail: null,
      })),
      emptyText: t('PROJECT.READY_NO_BOARDS'),
    },
    columnsTitle: board === null ? '' : t('PROJECT.READY_COLUMN', { board: board.name }),
    columns: (columns?.isListed === true ? columns.columns : []).map((one) => ({
      name: one.name,
      detail: listOf(one.statuses),
      onPick: () => {
        if (board === null) return;

        onChange({
          column: { boardId: board.id, board: board.name, column: one.name },
          statuses: one.statuses,
        });
        setPicking(false);
        setBoard(null);
        setColumns(null);
      },
    })),
    onQuery: setQuery,
    onPickBoard: (id: string) => {
      const found =
        boards?.isListed === true
          ? (boards.boards.find((one) => String(one.id) === id) ?? null)
          : null;

      setColumns(null);
      setBoard(found);
    },
    onChange: () => {
      setPicking(true);
    },
    onClear: () => {
      onChange(null);
      setPicking(true);
    },
  };
};
