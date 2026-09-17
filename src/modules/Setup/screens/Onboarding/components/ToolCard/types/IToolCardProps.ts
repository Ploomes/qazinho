import type { ReactNode } from 'react';

/** A tool on this machine: found, missing, or off because the OS cannot run it. */
export interface IToolCardProps {
  name: string;
  about: string;
  detail: string;
  state: 'found' | 'missing' | 'off';
  badge: string;
  action?: ReactNode;
  children?: ReactNode;
}
