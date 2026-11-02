import type { ISegmentedControlProps } from '@/shared/components/molecules/SegmentedControl/types';
import type { KeyboardEvent } from 'react';
import { useId } from 'react';
import { SEGMENTED_KEY_STEPS } from '@/shared/components/molecules/SegmentedControl/constants';

export const useSegmentedControlViewModel = (props: ISegmentedControlProps) => {
  const { options, value, onChange } = props;
  const thumbId = useId();
  const picked = options.findIndex(({ id }) => id === value);
  const reachable = picked === -1 ? 0 : picked;

  return {
    thumbId,
    items: options.map((option, index) => ({
      id: option.id,
      label: option.label,
      isOn: option.id === value,
      tabIndex: index === reachable ? 0 : -1,
      className:
        option.id === value
          ? 'segmented__option segmented__option--on'
          : 'segmented__option',
      onPick: () => {
        onChange(option.id);
      },
    })),
    onItemKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      const step = SEGMENTED_KEY_STEPS[event.key];

      if (step === undefined || options.length === 0) return;

      event.preventDefault();

      const target = (reachable + step + options.length) % options.length;
      const next = options[target];

      if (next === undefined) return;

      onChange(next.id);
      event.currentTarget.parentElement
        ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
        [target]?.focus();
    },
  };
};
