// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProjectPaneViewModel } from '@/modules/Project/components/ProjectModal/components/ProjectPane/hooks/useProjectPaneViewModel';

function paneOf(isOpen: boolean) {
  return renderHook(() =>
    useProjectPaneViewModel({ label: 'Code', isOpen, children: null }),
  ).result.current;
}

describe('useProjectPaneViewModel', () => {
  it('shows the section that is open', () => {
    expect(paneOf(true)).toEqual({ animate: 'open', isShut: false });
  });

  it('keeps a shut section out of reach, so nothing in it is clicked or read aloud', () => {
    expect(paneOf(false)).toEqual({ animate: 'shut', isShut: true });
  });
});
