import type { IProjectNavProps } from '@/modules/Project/components/ProjectModal/components/ProjectNav/types';

export const useProjectNavViewModel = (props: IProjectNavProps) => {
  const { items, current, onSelect } = props;
  const firstDanger = items.find(({ isDanger }) => isDanger)?.id ?? null;

  return {
    items: items.map((item) => {
      const isActive = item.id === current;

      return {
        id: item.id,
        label: item.label,
        count: item.count,
        isActive,
        isFlagged: item.isFlagged && !isActive,
        className: [
          'project-nav__item',
          isActive ? 'project-nav__item--active' : '',
          item.isDanger ? 'project-nav__item--danger' : '',
          item.id === firstDanger ? 'project-nav__item--apart' : '',
        ]
          .filter((name) => name.length > 0)
          .join(' '),
        onClick: () => {
          if (!isActive) onSelect(item.id);
        },
      };
    }),
  };
};
