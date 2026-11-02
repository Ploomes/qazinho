import type { IViewportPickerProps } from '@/modules/Device/components/DeviceView/components/ViewportPicker/types';

export const useViewportPickerViewModel = (props: IViewportPickerProps) => ({
  options: props.viewports.map((option) => ({
    ...option,
    className: option.isActive
      ? 'viewport-picker__option viewport-picker__option--on'
      : 'viewport-picker__option',
    onSelect: () => {
      props.onSelect(option.id);
    },
  })),
});
