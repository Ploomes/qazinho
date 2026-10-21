import type { ReactNode } from 'react';

/** A section of the project window, open or kept shut with what was typed in it. */
export interface IProjectPaneProps {
  label: string;
  isOpen: boolean;
  children: ReactNode;
}
