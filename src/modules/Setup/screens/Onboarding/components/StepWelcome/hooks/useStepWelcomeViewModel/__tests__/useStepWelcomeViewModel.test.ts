// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useStepWelcomeViewModel } from '@/modules/Setup/screens/Onboarding/components/StepWelcome/hooks/useStepWelcomeViewModel';
import { useSettingsStore } from '@/store';

beforeEach(() => {
  useSettingsStore.setState({ language: 'en' });
});

describe('useStepWelcomeViewModel', () => {
  it('offers every language, with the one in use marked', () => {
    const { result } = renderHook(() => useStepWelcomeViewModel());

    expect(result.current.languages.map(({ id, isActive }) => [id, isActive])).toEqual([
      ['en', true],
      ['pt', false],
    ]);
  });

  it('switches the interface to the language picked', () => {
    const { result } = renderHook(() => useStepWelcomeViewModel());

    act(() => {
      result.current.languages[1]?.onSelect();
    });

    expect(useSettingsStore.getState().language).toBe('pt');
  });
});
