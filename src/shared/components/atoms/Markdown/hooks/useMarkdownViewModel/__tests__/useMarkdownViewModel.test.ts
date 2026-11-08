// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMarkdownViewModel } from '@/shared/components/atoms/Markdown/hooks/useMarkdownViewModel';

describe('useMarkdownViewModel', () => {
  it('lets the blocks rise in while the agent is still writing them', () => {
    expect(
      renderHook(() => useMarkdownViewModel({ children: 'hi', isStreaming: true })).result
        .current.className,
    ).toBe('markdown markdown--stream');
  });

  it('does NOT move text that is already on screen', () => {
    expect(
      renderHook(() => useMarkdownViewModel({ children: 'hi' })).result.current.className,
    ).toBe('markdown');
  });
});
