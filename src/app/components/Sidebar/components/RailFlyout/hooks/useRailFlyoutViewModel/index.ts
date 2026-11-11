import type { IRailFlyoutProps } from '@/app/components/Sidebar/components/RailFlyout/types';
import type { CSSProperties } from 'react';

export const useRailFlyoutViewModel = (props: Pick<IRailFlyoutProps, 'flyout'>) => ({
  style: {
    '--flyout-top': `${String(props.flyout.top)}px`,
    '--flyout-left': `${String(props.flyout.left)}px`,
  } as CSSProperties,
});
