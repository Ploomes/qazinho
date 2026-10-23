import type { IConfluencePageRef } from '@/shared/types';

const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/** The page a search found that the QA meant: the one with the id their link had, else the one titled as they wrote it, else the first found; null when none was. */
export function pickPage(props: {
  wanted: { id: string | null; title: string };
  pages: IConfluencePageRef[];
}): IConfluencePageRef | null {
  const { wanted, pages } = props;

  return (
    pages.find(({ id }) => id === wanted.id) ??
    pages.find(({ title }) => plain(title) === plain(wanted.title)) ??
    pages[0] ??
    null
  );
}
