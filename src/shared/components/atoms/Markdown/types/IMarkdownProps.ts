/** Markdown an agent wrote, as text: it is rendered, never run as HTML. `isRevealing` lets its blocks rise in one after another. */
export interface IMarkdownProps {
  children: string;
  isRevealing?: boolean;
}
