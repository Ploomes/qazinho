import type { ReactNode } from 'react';

/**
 * A tool on this machine: found, missing, or off. With `onSelect` it is an option to
 * pick, `isSelected` the one picked.
 */
export interface IToolCardProps {
  name: string;
  about: string;
  detail: string;
  state: 'found' | 'missing' | 'off';
  badge: string;
  action?: ReactNode;
  children?: ReactNode;
  isSelected?: boolean;
  onSelect?: () => void;
}
