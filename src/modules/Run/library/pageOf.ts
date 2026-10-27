/**
 * One page of a list, with the page clamped to one that exists, so a shrinking list never
 * shows an empty page.
 */
export function pageOf<T>(props: { items: T[]; page: number; size: number }): {
  items: T[];
  page: number;
  pageCount: number;
  from: number;
  to: number;
} {
  const { items, size } = props;
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(Math.max(0, props.page), pageCount - 1);
  const start = page * size;
  const shown = items.slice(start, start + size);

  return {
    items: shown,
    page,
    pageCount,
    from: shown.length === 0 ? 0 : start + 1,
    to: start + shown.length,
  };
}
