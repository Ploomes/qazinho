import type { IMetaLinkProps } from '@/modules/Workspace/screens/Workspace/components/MetaLink/types';

export const useMetaLinkViewModel = (props: IMetaLinkProps) => {
  const { onDrop } = props;

  return {
    canDrop: onDrop !== undefined,
    dropLabel: props.dropLabel ?? '',
    onDropClick: () => {
      onDrop?.();
    },
  };
};
