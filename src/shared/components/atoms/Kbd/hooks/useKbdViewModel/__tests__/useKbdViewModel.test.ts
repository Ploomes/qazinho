// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useKbdViewModel } from '@/shared/components/atoms/Kbd/hooks';

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useKbdViewModel', () => {
  it('shows the shortcut the way the keyboard in front of the QA names it', () => {
    window.qazinho = fakeQazinhoApi('win32');

    expect(renderHook(() => useKbdViewModel({ combo: '⌘↵' })).result.current.label).toBe(
      'Ctrl+↵',
    );

    window.qazinho = fakeQazinhoApi('darwin');

    expect(renderHook(() => useKbdViewModel({ combo: '⌘↵' })).result.current.label).toBe(
      '⌘↵',
    );
  });
});
