import { parseCorpusFile } from '@/harness/context/library';

export const CORPUS = Object.entries(
  import.meta.glob('@/harness/context/corpus/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
).map(([path, text]) => parseCorpusFile({ path, text }));
