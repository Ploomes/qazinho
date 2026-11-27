// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useHelpMenuViewModel } from '@/modules/Help/components/HelpMenu/hooks/useHelpMenuViewModel';
import { useAppStore } from '@/store';

/** O botão de ajuda num lugar da janela, para o menu abrir ao lado dele. */
function mounted(
  side: 'above' | 'right',
  box = { top: 840, bottom: 872, left: 200, right: 232 },
) {
  const hook = renderHook(() => useHelpMenuViewModel({ side }));
  const anchor = document.createElement('span');

  anchor.getBoundingClientRect = () => ({ ...box, width: 32, height: 32 }) as DOMRect;
  (hook.result.current.anchorRef as { current: HTMLSpanElement | null }).current = anchor;

  return hook;
}

beforeEach(async () => {
  await i18n.changeLanguage('pt');
  window.innerWidth = 1440;
  window.innerHeight = 900;
  useAppStore.setState({ modal: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useHelpMenuViewModel', () => {
  it('lists the headline of each of the newest versions this app has, with its day', () => {
    const { result } = mounted('above');

    expect(result.current.news.length).toBeGreaterThan(0);
    expect(result.current.news.length).toBeLessThanOrEqual(3);
    expect(result.current.news[0]?.day).toMatch(/de \w+\./);
  });

  describe('onToggle', () => {
    it('opens above the foot of the sidebar, inside the window', () => {
      const { result } = mounted('above');

      act(() => {
        result.current.onToggle();
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.menuStyle).toMatchObject({
        '--help-menu-left': '8px',
        '--help-menu-bottom': '68px',
      });
    });

    it('opens to the right of the rail, its foot level with the button', () => {
      const { result } = mounted('right', { top: 800, bottom: 840, left: 8, right: 48 });

      act(() => {
        result.current.onToggle();
      });

      expect(result.current.menuStyle).toMatchObject({
        '--help-menu-left': '56px',
        '--help-menu-bottom': '60px',
      });
    });

    it('closes on a second click', () => {
      const { result } = mounted('above');

      act(() => {
        result.current.onToggle();
      });
      act(() => {
        result.current.onToggle();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  it('opens every version in a window, and closes the menu', () => {
    const { result } = mounted('above');

    act(() => {
      result.current.onToggle();
    });
    act(() => {
      result.current.onNews();
    });

    expect(useAppStore.getState().modal).toBe('news');
    expect(result.current.isOpen).toBe(false);
  });
});
