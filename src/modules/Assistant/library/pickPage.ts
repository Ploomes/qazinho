import type { IConfluencePageRef } from '@/shared/types';

/**
 * A página que uma busca achou e que o QA quis dizer: a com o id que o link dele tinha,
 * senão a com o título como ele escreveu, senão a primeira; null quando nenhuma.
 */
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

const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
