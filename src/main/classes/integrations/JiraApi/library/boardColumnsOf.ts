import type { IBoardColumn } from '@/shared/types';

/**
 * As colunas de um board pela configuração dele, cada uma com o nome dos status que caem
 * nela, lidos da lista de status do site.
 */
export function boardColumnsOf(props: {
  config: unknown;
  statuses: unknown;
}): IBoardColumn[] {
  const names = new Map(
    (Array.isArray(props.statuses) ? props.statuses : []).flatMap((status) => {
      const { id, name } = (status ?? {}) as { id?: unknown; name?: unknown };

      return typeof name === 'string' &&
        (typeof id === 'string' || typeof id === 'number')
        ? [[String(id), name.trim()] as const]
        : [];
    }),
  );
  const { columnConfig } = (props.config ?? {}) as {
    columnConfig?: { columns?: unknown };
  };
  const columns = columnConfig?.columns;

  return (Array.isArray(columns) ? columns : []).flatMap((column): IBoardColumn[] => {
    const { name, statuses } = (column ?? {}) as { name?: unknown; statuses?: unknown };

    if (typeof name !== 'string' || name.trim() === '') return [];

    return [
      {
        name: name.trim(),
        statuses: (Array.isArray(statuses) ? statuses : []).flatMap((status) => {
          const { id } = (status ?? {}) as { id?: unknown };
          const named = names.get(String(id));

          return named === undefined || named === '' ? [] : [named];
        }),
      },
    ];
  });
}
