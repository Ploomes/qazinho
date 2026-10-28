import type { ReactNode } from 'react';

/** Um link dentro de markdown renderizado. */
export interface IMarkdownLinkProps {
  href?: string;
  children?: ReactNode;
}
