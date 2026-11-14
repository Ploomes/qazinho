// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDesignFieldViewModel } from '@/modules/Home/screens/NewProject/components/DesignField/hooks';

describe('useDesignFieldViewModel', () => {
  it('reads a Figma link into the design it opens', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDesignFieldViewModel({ value: null, onChange }),
    );

    act(() => {
      result.current.onText('https://www.figma.com/design/abc123/Loja?node-id=1-2');
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ fileKey: 'abc123', nodeId: '1:2' }),
    );
  });

  it('hands back no design for a link that is not one, and says so', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useDesignFieldViewModel({ value: null, onChange }),
    );

    act(() => {
      result.current.onText('https://loja.dev');
    });

    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(result.current.statusClassName).toContain('--bad');
  });

  it('names the design once it has one', () => {
    const { result } = renderHook(() =>
      useDesignFieldViewModel({
        value: {
          url: 'https://www.figma.com/design/abc',
          fileKey: 'abc',
          nodeId: null,
          name: 'Checkout',
        },
        onChange: vi.fn(),
      }),
    );

    expect(result.current.statusText).toBe('Design: Checkout');
  });
});
