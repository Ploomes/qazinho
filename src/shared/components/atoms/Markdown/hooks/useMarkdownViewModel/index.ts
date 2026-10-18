import type { IMarkdownProps } from '@/shared/components/atoms/Markdown/types';

export const useMarkdownViewModel = (props: IMarkdownProps) => ({
  className: props.isRevealing === true ? 'markdown markdown--reveal' : 'markdown',
});
