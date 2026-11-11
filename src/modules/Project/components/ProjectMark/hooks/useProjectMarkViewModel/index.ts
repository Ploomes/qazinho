import type { IProjectMarkProps } from '@/modules/Project/components/ProjectMark/types';
import type { CSSProperties } from 'react';

export const useProjectMarkViewModel = (props: IProjectMarkProps) => {
  const { mark, size } = props;

  return {
    className: mark.kind === 'icon' ? 'project-mark project-mark--icon' : 'project-mark',
    style: { '--project-mark': `${String(size)}px` } as CSSProperties,
    src: mark.kind === 'icon' ? mark.src : null,
    platform: mark.kind === 'platform' ? mark.platform : null,
    initial: mark.kind === 'initial' ? mark.initial : null,
    glyphSize: Math.round(size * 0.7),
  };
};
