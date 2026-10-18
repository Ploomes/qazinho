import type { Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MarkdownLink } from '@/shared/components/atoms/Markdown/components';

export const MARKDOWN: Pick<Options, 'remarkPlugins' | 'components'> = {
  remarkPlugins: [remarkGfm],
  components: { a: MarkdownLink },
};
