// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useWelcomeViewModel } from '@/modules/Project/screens/Welcome/hooks/useWelcomeViewModel';
import { useAppStore } from '@/store';

describe('useWelcomeViewModel', () => {
  beforeEach(() => {
    useAppStore.setState({ modal: null });
  });

  describe('onNewProject', () => {
    it('asks for the project modal, because a project is the only way in', () => {
      const { result } = renderHook(() => useWelcomeViewModel());

      act(() => result.current.onNewProject());

      expect(useAppStore.getState().modal).toBe('project');
    });
  });
});
