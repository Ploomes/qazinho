// @vitest-environment jsdom
import type { KeyboardEvent, UIEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useComposerViewModel } from '@/modules/Chat/screens/Chat/components/Composer/hooks/useComposerViewModel';

const PROPS = {
  value: 'Test the whole checkout',
  lockedText: null,
  isAnswering: false,
  isAutoFocused: false,
  mentions: [],
  referenceIds: ['TC-05', 'r-01'],
  mentionQuery: null,
  hasReferences: false,
  onChange: vi.fn(),
  onSend: vi.fn(),
  onStop: vi.fn(),
  onPickMention: vi.fn(),
  command: null,
  commandPicker: null,
  onPickCommand: vi.fn(),
  onCommandBack: vi.fn(),
  onCommandCancel: vi.fn(),
};

const PICKER = {
  heading: 'commands',
  rows: [
    {
      id: 'code-plan',
      label: 'Plan from the code',
      tag: '/code',
      detail: null,
      isBlocked: false,
    },
  ],
  note: null,
  hint: '↑↓ to choose',
};

const ON_BRANCH = {
  name: 'Plan from the code',
  parts: [{ key: 'acme/loja-web', text: 'acme/loja-web', isStrong: false }],
  isReady: false,
  placeholder: 'Which branch? Type to search',
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
  describe('parts', () => {
    it('marks what a typed @ points at, so it stands out in the field', () => {
      const { result } = renderHook(() =>
        useComposerViewModel({ ...PROPS, value: 'why did @TC-05 fail in @r-01?' }),
      );

      expect(
        result.current.parts.map(({ text, isMention }) => [text, isMention]),
      ).toEqual([
        ['why did ', false],
        ['@TC-05', true],
        [' fail in ', false],
        ['@r-01', true],
        ['?', false],
      ]);
    });

    it('does NOT mark an @ that points at nothing, or is still being typed', () => {
      const { result } = renderHook(() =>
        useComposerViewModel({ ...PROPS, value: 'look at @TC-0 and @TC-99' }),
      );

      expect(result.current.parts.some(({ isMention }) => isMention)).toBe(false);
    });
  });

  describe('onInputScroll', () => {
    it('scrolls the marked copy of the text along with the field', () => {
      const { result } = renderHook(() => useComposerViewModel(PROPS));
      const mirror = document.createElement('div');

      result.current.mirrorRef.current = mirror;
      result.current.onInputScroll({
        currentTarget: { scrollLeft: 120 },
      } as unknown as UIEvent<HTMLInputElement>);

      expect(mirror.scrollLeft).toBe(120);
    });
  });

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
        canPress: false,
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
        placeholder: 'Ask the agent · @ to cite · / for commands',
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

    expect(result.current.canPress).toBe(false);

    result.current.onSendClick();

    expect(onSend).not.toHaveBeenCalled();
  });

  it('turns the button into stop while the agent answers, and stops it', () => {
    const onStop = vi.fn();
    const onSend = vi.fn();
    const { result } = renderHook(() =>
      useComposerViewModel({ ...PROPS, isAnswering: true, onStop, onSend }),
    );

    expect(result.current.button.label).toBe('Stop the answer');
    expect(result.current.canPress).toBe(true);

    result.current.onButtonClick();

    expect(onStop).toHaveBeenCalledOnce();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does NOT send, nor stop the agent, on Enter while it answers', () => {
    const onStop = vi.fn();
    const onSend = vi.fn();
    const { result } = renderHook(() =>
      useComposerViewModel({ ...PROPS, isAnswering: true, onStop, onSend }),
    );

    result.current.onKeyDown(pressed('Enter'));

    expect(onSend).not.toHaveBeenCalled();
    expect(onStop).not.toHaveBeenCalled();
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

  describe('commands', () => {
    it('opens the commands for a slash, and keeps the @ picker shut meanwhile', () => {
      const { result } = renderHook(() =>
        useComposerViewModel({
          ...PROPS,
          value: '/',
          mentionQuery: '',
          hasReferences: true,
          commandPicker: PICKER,
        }),
      );

      expect(result.current.isCommandOpen).toBe(true);
      expect(result.current.isPickerOpen).toBe(false);
    });

    it('picks the highlighted command on Enter instead of sending the slash', () => {
      const onPickCommand = vi.fn();
      const onSend = vi.fn();
      const { result } = renderHook(() =>
        useComposerViewModel({
          ...PROPS,
          value: '/',
          commandPicker: PICKER,
          onPickCommand,
          onSend,
        }),
      );
      const enter = pressed('Enter');

      act(() => {
        result.current.onKeyDown(enter);
      });

      expect(onPickCommand).toHaveBeenCalledWith('code-plan');
      expect(onSend).not.toHaveBeenCalled();
      expect(enter.preventDefault).toHaveBeenCalled();
    });

    it('picks a command that still needs something, so the QA is taken to it', () => {
      const onPickCommand = vi.fn();
      const { result } = renderHook(() =>
        useComposerViewModel({
          ...PROPS,
          value: '/',
          commandPicker: {
            ...PICKER,
            rows: PICKER.rows.map((row) => ({ ...row, isBlocked: true })),
          },
          onPickCommand,
        }),
      );

      act(() => {
        result.current.onKeyDown(pressed('Enter'));
      });

      expect(onPickCommand).toHaveBeenCalledWith('code-plan');
    });

    it('shuts the slash picker on Escape until the QA types again', () => {
      const { result } = renderHook(() =>
        useComposerViewModel({ ...PROPS, value: '/', commandPicker: PICKER }),
      );

      act(() => {
        result.current.onKeyDown(pressed('Escape'));
      });

      expect(result.current.isCommandOpen).toBe(false);
    });

    it('lets go of a command on Escape, and steps back on Backspace in an empty field', () => {
      const onCommandCancel = vi.fn();
      const onCommandBack = vi.fn();
      const { result } = renderHook(() =>
        useComposerViewModel({
          ...PROPS,
          value: '',
          command: ON_BRANCH,
          commandPicker: { ...PICKER, heading: 'branch of acme/loja-web' },
          onCommandCancel,
          onCommandBack,
        }),
      );

      act(() => {
        result.current.onKeyDown(pressed('Escape'));
      });

      expect(onCommandCancel).toHaveBeenCalledTimes(1);

      const { result: typed } = renderHook(() =>
        useComposerViewModel({ ...PROPS, value: '', command: ON_BRANCH, onCommandBack }),
      );

      act(() => {
        typed.current.onKeyDown(pressed('Backspace'));
      });

      expect(onCommandBack).toHaveBeenCalledTimes(1);
    });

    it('sends a ready command with no words, and asks for what the command needs next', () => {
      const onSend = vi.fn();
      const { result } = renderHook(() =>
        useComposerViewModel({
          ...PROPS,
          value: '',
          command: {
            ...ON_BRANCH,
            parts: [
              ...ON_BRANCH.parts,
              { key: 'branch-feat/cupom', text: 'feat/cupom', isStrong: true },
            ],
            isReady: true,
            placeholder: 'Anything else?',
          },
          onSend,
        }),
      );

      expect(result.current.placeholder).toBe('Anything else?');
      expect(result.current.canPress).toBe(true);

      act(() => {
        result.current.onKeyDown(pressed('Enter'));
      });

      expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('does NOT send a command still missing its branch', () => {
      const { result } = renderHook(() =>
        useComposerViewModel({ ...PROPS, value: 'something', command: ON_BRANCH }),
      );

      expect(result.current.canPress).toBe(false);
    });

    it('shows what the command names so far, the part that matters most standing out', () => {
      const { result } = renderHook(() =>
        useComposerViewModel({
          ...PROPS,
          command: {
            ...ON_BRANCH,
            parts: [
              { key: 'key-SHOP-12', text: 'SHOP-12', isStrong: true },
              { key: 'summary-SHOP-12', text: 'Aplicar cupom', isStrong: false },
            ],
          },
        }),
      );

      expect(result.current.commandChip?.parts).toEqual([
        {
          key: 'key-SHOP-12',
          text: 'SHOP-12',
          className: 'composer__command-part composer__command-part--strong',
        },
        {
          key: 'summary-SHOP-12',
          text: 'Aplicar cupom',
          className: 'composer__command-part',
        },
      ]);
    });
  });
});
