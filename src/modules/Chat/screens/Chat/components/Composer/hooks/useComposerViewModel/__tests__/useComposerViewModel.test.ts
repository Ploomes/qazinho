// @vitest-environment jsdom
import type { KeyboardEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useComposerViewModel } from '@/modules/Chat/screens/Chat/components/Composer/hooks/useComposerViewModel';

const PROPS = {
  value: 'Test the whole checkout',
  lockedText: null,
  mentions: [],
  mentionQuery: null,
  hasReferences: false,
  onChange: vi.fn(),
  onSend: vi.fn(),
  onPickMention: vi.fn(),
};

const MENTIONING = {
  ...PROPS,
  value: 'what happened in @r',
  mentionQuery: 'r',
  hasReferences: true,
  mentions: [
    { kind: 'run' as const, id: 'r-02', title: 'The whole plan', facts: [] },
    { kind: 'run' as const, id: 'r-01', title: 'Checkout only', facts: [] },
  ],
};

const EVERY_KIND = {
  ...PROPS,
  value: 'look at @',
  mentionQuery: '',
  hasReferences: true,
  mentions: [
    { kind: 'run' as const, id: 'r-01', title: 'The whole plan', facts: [] },
    {
      kind: 'bug' as const,
      id: 'BUG-01',
      title: 'Coupon accepts expired codes',
      facts: [],
    },
    { kind: 'case' as const, id: 'TC-01', title: 'Login', facts: [] },
    { kind: 'case' as const, id: 'TC-02', title: 'Logout', facts: [] },
  ],
};

function pressed(key: string, shiftKey = false) {
  return {
    key,
    shiftKey,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent<HTMLInputElement>;
}

describe('useComposerViewModel', () => {
  describe('a chat locked while a run goes', () => {
    const LOCKED =
      'A run is going: stop it, or wait for it to end, to talk to the agent.';

    it('does NOT send, not even what was already typed, and says why in the field', () => {
      const onSend = vi.fn();
      const { result } = renderHook(() =>
        useComposerViewModel({ ...PROPS, lockedText: LOCKED, onSend }),
      );

      result.current.onSendClick();
      result.current.onKeyDown(pressed('Enter'));

      expect(onSend).not.toHaveBeenCalled();
      expect(result.current).toMatchObject({
        canSend: false,
        isLocked: true,
        placeholder: LOCKED,
        fieldClassName: 'composer__field composer__field--locked',
      });
    });

    it('does NOT open the @ list while locked', () => {
      const { result } = renderHook(() =>
        useComposerViewModel({ ...MENTIONING, lockedText: LOCKED }),
      );

      expect(result.current.isPickerOpen).toBe(false);
    });

    it('asks for a message again once the run is over', () => {
      const { result } = renderHook(() => useComposerViewModel(PROPS));

      expect(result.current).toMatchObject({
        isLocked: false,
        placeholder: 'Ask the agent anything · @ points at a run, bug or case',
        fieldClassName: 'composer__field',
      });
    });
  });

  it('sends what the QA typed', () => {
    const onSend = vi.fn();
    const { result } = renderHook(() => useComposerViewModel({ ...PROPS, onSend }));

    result.current.onSendClick();

    expect(onSend).toHaveBeenCalledOnce();
  });

  it('does NOT send an empty message', () => {
    const onSend = vi.fn();
    const { result } = renderHook(() =>
      useComposerViewModel({ ...PROPS, value: '   ', onSend }),
    );

    expect(result.current.canSend).toBe(false);

    result.current.onSendClick();

    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends on Enter', () => {
    const onSend = vi.fn();
    const { result } = renderHook(() => useComposerViewModel({ ...PROPS, onSend }));

    result.current.onKeyDown(pressed('Enter'));

    expect(onSend).toHaveBeenCalledOnce();
  });

  it('does NOT send on shift-Enter, which is how a second line is typed', () => {
    const onSend = vi.fn();
    const { result } = renderHook(() => useComposerViewModel({ ...PROPS, onSend }));

    result.current.onKeyDown(pressed('Enter', true));

    expect(onSend).not.toHaveBeenCalled();
  });

  describe('the @ picker', () => {
    it('opens while the draft is mentioning something that exists', () => {
      const { result } = renderHook(() => useComposerViewModel(MENTIONING));

      expect(result.current.isPickerOpen).toBe(true);
      expect(result.current.highlighted).toBe(0);
    });

    it('does NOT open while the QA is not mentioning', () => {
      const { result } = renderHook(() => useComposerViewModel(PROPS));

      expect(result.current.isPickerOpen).toBe(false);
    });

    it('opens on a bare @ even when the workspace has nothing to point at yet', () => {
      const { result } = renderHook(() =>
        useComposerViewModel({ ...PROPS, value: '@', mentionQuery: '' }),
      );

      expect(result.current.isPickerOpen).toBe(true);
    });

    it('still sends on Enter when the open picker has no row to pick', () => {
      const onSend = vi.fn();
      const { result } = renderHook(() =>
        useComposerViewModel({
          ...PROPS,
          value: 'look at @zzz',
          mentionQuery: 'zzz',
          onSend,
        }),
      );

      act(() => {
        result.current.onKeyDown(pressed('ArrowDown'));
        result.current.onKeyDown(pressed('Enter'));
      });

      expect(onSend).toHaveBeenCalledOnce();
    });

    it('closes an empty picker on Escape', () => {
      const { result } = renderHook(() =>
        useComposerViewModel({ ...PROPS, value: '@', mentionQuery: '' }),
      );

      act(() => {
        result.current.onKeyDown(pressed('Escape'));
      });

      expect(result.current.isPickerOpen).toBe(false);
    });

    it('moves down and wraps back to the top with the arrows', () => {
      const { result } = renderHook(() => useComposerViewModel(MENTIONING));

      act(() => {
        result.current.onKeyDown(pressed('ArrowDown'));
      });

      expect(result.current.highlighted).toBe(1);

      act(() => {
        result.current.onKeyDown(pressed('ArrowDown'));
      });

      expect(result.current.highlighted).toBe(0);

      act(() => {
        result.current.onKeyDown(pressed('ArrowUp'));
      });

      expect(result.current.highlighted).toBe(1);
    });

    it('picks the highlighted reference on Enter, and does NOT send', () => {
      const onSend = vi.fn();
      const onPickMention = vi.fn();
      const { result } = renderHook(() =>
        useComposerViewModel({ ...MENTIONING, onSend, onPickMention }),
      );

      act(() => {
        result.current.onKeyDown(pressed('ArrowDown'));
      });
      act(() => {
        result.current.onKeyDown(pressed('Enter'));
      });

      expect(onPickMention).toHaveBeenCalledWith('r-01');
      expect(onSend).not.toHaveBeenCalled();
    });

    it('closes on Escape, and opens again once the QA keeps typing', () => {
      const { result, rerender } = renderHook((props) => useComposerViewModel(props), {
        initialProps: MENTIONING,
      });

      act(() => {
        result.current.onKeyDown(pressed('Escape'));
      });

      expect(result.current.isPickerOpen).toBe(false);

      rerender({ ...MENTIONING, value: 'what happened in @r-' });

      expect(result.current.isPickerOpen).toBe(true);
    });

    it('opens on the cases, with what each tab holds', () => {
      const { result } = renderHook(() => useComposerViewModel(EVERY_KIND));

      expect(result.current.tabs).toEqual([
        { kind: 'case', count: 2, isActive: true },
        { kind: 'bug', count: 1, isActive: false },
        { kind: 'run', count: 1, isActive: false },
      ]);
      expect(result.current.shown.map(({ id }) => id)).toEqual(['TC-01', 'TC-02']);
    });

    it('opens on the tab that holds what was typed', () => {
      const { result } = renderHook(() =>
        useComposerViewModel({
          ...EVERY_KIND,
          value: 'look at @BUG',
          mentionQuery: 'BUG',
          mentions: EVERY_KIND.mentions.filter(({ kind }) => kind === 'bug'),
        }),
      );

      expect(result.current.tabs.find(({ isActive }) => isActive)?.kind).toBe('bug');
    });

    it('switches tabs with the side arrows, and picks from the tab that is open', () => {
      const onPickMention = vi.fn();
      const { result } = renderHook(() =>
        useComposerViewModel({ ...EVERY_KIND, onPickMention }),
      );

      act(() => {
        result.current.onKeyDown(pressed('ArrowRight'));
      });

      expect(result.current.shown.map(({ id }) => id)).toEqual(['BUG-01']);

      act(() => {
        result.current.onKeyDown(pressed('ArrowLeft'));
      });
      act(() => {
        result.current.onKeyDown(pressed('ArrowLeft'));
      });

      expect(result.current.shown.map(({ id }) => id)).toEqual(['r-01']);

      act(() => {
        result.current.onKeyDown(pressed('Enter'));
      });

      expect(onPickMention).toHaveBeenCalledWith('r-01');
    });

    it('skips a tab that holds nothing', () => {
      const { result } = renderHook(() =>
        useComposerViewModel({
          ...EVERY_KIND,
          mentions: EVERY_KIND.mentions.filter(({ kind }) => kind !== 'bug'),
        }),
      );

      act(() => {
        result.current.onKeyDown(pressed('ArrowRight'));
      });

      expect(result.current.tabs.find(({ isActive }) => isActive)?.kind).toBe('run');
    });

    it('leaves the side arrows to the text when only one tab holds something', () => {
      const { result } = renderHook(() => useComposerViewModel(MENTIONING));
      const right = pressed('ArrowRight');

      act(() => {
        result.current.onKeyDown(right);
      });

      expect(right.preventDefault).not.toHaveBeenCalled();
    });

    it('keeps the tab the QA opened while it still holds a match', () => {
      const { result, rerender } = renderHook((props) => useComposerViewModel(props), {
        initialProps: EVERY_KIND,
      });

      act(() => {
        result.current.onTab('run');
      });
      rerender({ ...EVERY_KIND, value: 'look at @r' });

      expect(result.current.tabs.find(({ isActive }) => isActive)?.kind).toBe('run');

      rerender({
        ...EVERY_KIND,
        mentions: EVERY_KIND.mentions.filter(({ kind }) => kind !== 'run'),
      });

      expect(result.current.tabs.find(({ isActive }) => isActive)?.kind).toBe('case');
    });

    it('never highlights past the end when the list gets shorter', () => {
      const { result, rerender } = renderHook((props) => useComposerViewModel(props), {
        initialProps: MENTIONING,
      });

      act(() => {
        result.current.onKeyDown(pressed('ArrowDown'));
      });
      rerender({ ...MENTIONING, mentions: MENTIONING.mentions.slice(0, 1) });

      expect(result.current.highlighted).toBe(0);
    });
  });
});
