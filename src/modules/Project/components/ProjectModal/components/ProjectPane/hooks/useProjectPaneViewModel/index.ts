import type { IProjectPaneProps } from '@/modules/Project/components/ProjectModal/components/ProjectPane/types';

export const useProjectPaneViewModel = (props: IProjectPaneProps) => ({
  animate: props.isOpen ? 'open' : 'shut',
  isShut: !props.isOpen,
});
