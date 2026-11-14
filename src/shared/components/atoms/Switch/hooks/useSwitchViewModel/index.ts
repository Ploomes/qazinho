import type { ISwitchProps } from '@/shared/components/atoms/Switch/types';
import type { CSSProperties } from 'react';
import { SWITCH } from '@/shared/components/atoms/Switch/constants';
import { STICKER } from '@/shared/constants';

export const useSwitchViewModel = (props: ISwitchProps) => {
  const { isOn, onChange } = props;

  return {
    className: [
      'switch',
      isOn ? 'switch--on' : '',
      props.isLabelHidden === true ? 'switch--bare' : '',
    ]
      .filter((part) => part !== '')
      .join(' '),
    labelClassName:
      props.isLabelHidden === true
        ? 'switch__label switch__label--hidden'
        : 'switch__label',
    style: {
      '--switch-width': `${String(SWITCH.widthPx)}px`,
      '--switch-height': `${String(SWITCH.heightPx)}px`,
      '--switch-knob': `${String(SWITCH.knobPx)}px`,
    } as CSSProperties,
    hasIcon: props.icon !== undefined,
    icon: props.icon ?? 'idle',
    knob: { x: isOn ? SWITCH.travelPx : 0 },
    knobTransition: STICKER.spring,
    onSwitchClick: () => {
      onChange(!isOn);
    },
  };
};
