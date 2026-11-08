import type { IMarkdownProps } from '@/shared/components/atoms/Markdown/types';

export const useMarkdownViewModel = (props: IMarkdownProps) => ({
  className: props.isStreaming === true ? 'markdown markdown--stream' : 'markdown',
});
