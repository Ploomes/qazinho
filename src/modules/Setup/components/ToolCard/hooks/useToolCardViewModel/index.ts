import type { IToolCardProps } from '@/modules/Setup/components/ToolCard/types';
import type { KeyboardEvent } from 'react';

export const useToolCardViewModel = (props: IToolCardProps) => {
  const { state, isSelected = false, onSelect } = props;
  const isOption = onSelect !== undefined && state === 'found';

  return {
    isOption,
    isSelected: isOption && isSelected,
    className: [
      'tool-card',
      `tool-card--${state}`,
      isOption ? 'tool-card--option' : '',
      isOption && isSelected ? 'tool-card--selected' : '',
    ]
      .filter((part) => part.length > 0)
      .join(' '),
    onClick: () => {
      if (isOption && !isSelected) onSelect();
    },
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (!isOption || (event.key !== 'Enter' && event.key !== ' ')) return;

      event.preventDefault();
      if (!isSelected) onSelect();
    },
  };
};
