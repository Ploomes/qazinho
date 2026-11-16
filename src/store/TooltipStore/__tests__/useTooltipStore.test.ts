import type { IShownTip } from '@/store/TooltipStore/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTooltipStore } from '@/store';

const row = { id: 'row' } as unknown as Element;
const tipOf = (id: string, over: Partial<IShownTip> = {}): IShownTip => ({
  id,
  group: row,
  box: { top: 0, left: 0, right: 10, bottom: 10, width: 10, height: 10 },
  content: id,
  side: 'right',
  isWide: false,
  ...over,
});

beforeEach(() => {
  vi.useFakeTimers();
  useTooltipStore.setState({ tip: null, session: 0, closedAt: 0, lingerTimer: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTooltipStore', () => {
  it('keeps one panel open while the tip moves along one row', () => {
    const store = useTooltipStore.getState();

    store.show(tipOf('home'));
    store.show(tipOf('bugs'));

    expect(useTooltipStore.getState()).toMatchObject({ session: 1, tip: { id: 'bugs' } });
  });

  it('opens a new panel for a tip on another side, or with no row', () => {
    const store = useTooltipStore.getState();

    store.show(tipOf('home'));
    store.show(tipOf('send', { side: 'below' }));
    store.show(tipOf('file', { side: 'below', group: null }));
    store.show(tipOf('link', { side: 'below', group: null }));

    expect(useTooltipStore.getState().session).toBe(4);
  });

  /** O ponteiro atravessa o vão entre dois botões, e a dica fechava no meio do caminho. */
  it('lingers while the pointer crosses the gap to the next button', () => {
    const store = useTooltipStore.getState();

    store.show(tipOf('home'));
    store.hide({ id: 'home', isGroupHovered: true });
    vi.advanceTimersByTime(100);

    expect(useTooltipStore.getState().tip?.id).toBe('home');

    store.show(tipOf('bugs'));
    vi.advanceTimersByTime(200);

    expect(useTooltipStore.getState()).toMatchObject({ session: 1, tip: { id: 'bugs' } });
  });

  it('closes after the linger when no next button is reached', () => {
    const store = useTooltipStore.getState();

    store.show(tipOf('home'));
    store.hide({ id: 'home', isGroupHovered: true });
    vi.advanceTimersByTime(180);

    expect(useTooltipStore.getState().tip).toBeNull();
  });

  it('closes at once when the pointer leaves the row', () => {
    const store = useTooltipStore.getState();

    store.show(tipOf('home'));
    store.hide({ id: 'home', isGroupHovered: false });

    expect(useTooltipStore.getState().tip).toBeNull();
  });

  it('does NOT close the tip of another button', () => {
    const store = useTooltipStore.getState();

    store.show(tipOf('bugs'));
    store.hide({ id: 'home', isGroupHovered: false });

    expect(useTooltipStore.getState().tip?.id).toBe('bugs');
  });

  it('is warm while a tip shows and a moment after it closes', () => {
    const store = useTooltipStore.getState();

    expect(store.isWarm(Date.now())).toBe(false);

    store.show(tipOf('home'));

    expect(store.isWarm(Date.now())).toBe(true);

    store.hide({ id: 'home', isGroupHovered: false });

    expect(store.isWarm(Date.now() + 200)).toBe(true);
    expect(store.isWarm(Date.now() + 400)).toBe(false);
  });

  it('changes only the words of the tip it names', () => {
    const store = useTooltipStore.getState();

    store.show(tipOf('home'));
    store.update({ id: 'bugs', content: 'Bugs 3' });
    store.update({ id: 'home', content: 'Início 2' });

    expect(useTooltipStore.getState().tip?.content).toBe('Início 2');
  });
});
