import type { InternMood } from '@/components/atoms/Intern/types';
import type { ReactNode } from 'react';

export interface IEmptyStateProps {
  title: string;
  body: string;
  action?: ReactNode;
  mood?: InternMood;
}
