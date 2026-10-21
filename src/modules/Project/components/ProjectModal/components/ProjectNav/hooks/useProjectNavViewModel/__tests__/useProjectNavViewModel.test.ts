// @vitest-environment jsdom
import type { IProjectNavItem } from '@/modules/Project/components/ProjectModal/components/ProjectNav/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useProjectNavViewModel } from '@/modules/Project/components/ProjectModal/components/ProjectNav/hooks/useProjectNavViewModel';

const ITEMS: IProjectNavItem[] = [
  { id: 'general', label: 'General', count: null, isFlagged: false, isDanger: false },
  { id: 'code', label: 'Code', count: 2, isFlagged: false, isDanger: false },
  { id: 'variables', label: 'Variables', count: null, isFlagged: true, isDanger: false },
  {
    id: 'delete',
    label: 'Delete project',
    count: null,
    isFlagged: false,
    isDanger: true,
  },
];

function navOf(props: { current?: IProjectNavItem['id']; onSelect?: () => void } = {}) {
  return renderHook(() =>
    useProjectNavViewModel({
      label: 'Sections of the project',
      items: ITEMS,
      current: props.current ?? 'general',
      flagWord: 'needs a look',
      onSelect: props.onSelect ?? vi.fn(),
    }),
  ).result.current;
}

describe('useProjectNavViewModel', () => {
  describe('items', () => {
    it('marks the section that is open, and only that one', () => {
      expect(navOf({ current: 'code' }).items.map(({ isActive }) => isActive)).toEqual([
        false,
        true,
        false,
        false,
      ]);
      expect(navOf({ current: 'code' }).items[1]?.className).toBe(
        'project-nav__item project-nav__item--active',
      );
    });

    it('keeps the count of what a section holds, and none where it holds nothing', () => {
      expect(navOf().items.map(({ count }) => count)).toEqual([null, 2, null, null]);
    });

    it('sets deleting apart at the foot, in the colour of a danger', () => {
      expect(navOf().items[3]?.className).toBe(
        'project-nav__item project-nav__item--danger project-nav__item--apart',
      );
    });

    it('flags a section that keeps the project from saving while another one is open', () => {
      expect(navOf({ current: 'general' }).items[2]?.isFlagged).toBe(true);
    });

    it('does NOT flag the section the QA is already looking at', () => {
      expect(navOf({ current: 'variables' }).items[2]?.isFlagged).toBe(false);
    });
  });

  describe('onClick', () => {
    it('opens the section clicked', () => {
      const onSelect = vi.fn();

      navOf({ onSelect }).items[2]?.onClick();

      expect(onSelect).toHaveBeenCalledWith('variables');
    });

    it('does NOT open again the section that is already open', () => {
      const onSelect = vi.fn();

      navOf({ current: 'code', onSelect }).items[1]?.onClick();

      expect(onSelect).not.toHaveBeenCalled();
    });
  });
});
