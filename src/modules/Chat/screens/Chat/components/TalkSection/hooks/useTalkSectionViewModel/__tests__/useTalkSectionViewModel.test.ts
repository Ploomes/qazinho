// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTalkSectionViewModel } from '@/modules/Chat/screens/Chat/components/TalkSection/hooks/useTalkSectionViewModel';

const PROPS = {
  title: 'Talk with Claude Code',
  facts: '2 messages from it · 10:01',
  receipt: 'Claude Code read the answer at 10:04',
  isLive: false,
  isExpanded: true,
  onToggle: vi.fn(),
  children: null,
};

describe('useTalkSectionViewModel', () => {
  it('shows the talk and when the coding agent read it while open', () => {
    const { result } = renderHook(() => useTalkSectionViewModel(PROPS));

    expect(result.current).toMatchObject({
      className: 'talk-section',
      isBodyShown: true,
      hasReceipt: true,
    });
  });

  it('keeps only its line while folded', () => {
    const { result } = renderHook(() =>
      useTalkSectionViewModel({ ...PROPS, isExpanded: false }),
    );

    expect(result.current).toMatchObject({ isBodyShown: false, hasReceipt: false });
  });

  it('pulses while the agent of the chat answers it, and has no receipt before it is read', () => {
    const { result } = renderHook(() =>
      useTalkSectionViewModel({ ...PROPS, isLive: true, receipt: null }),
    );

    expect(result.current.className).toBe('talk-section talk-section--live');
    expect(result.current.hasReceipt).toBe(false);
  });
});
