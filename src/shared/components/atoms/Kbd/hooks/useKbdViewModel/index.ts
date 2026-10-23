import type { IKbdProps } from '@/shared/components/atoms/Kbd/types';
import { Platform } from '@/services';
import { comboLabelOf } from '@/shared/hooks/useKeybinds/library';

export const useKbdViewModel = (props: IKbdProps) => ({
  label: comboLabelOf({ combo: props.combo, isMac: Platform.isMac() }),
});
