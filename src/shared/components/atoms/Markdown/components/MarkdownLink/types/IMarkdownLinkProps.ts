import type { ReactNode } from 'react';

/** A link inside rendered markdown. */
export interface IMarkdownLinkProps {
  href?: string;
  children?: ReactNode;
}
