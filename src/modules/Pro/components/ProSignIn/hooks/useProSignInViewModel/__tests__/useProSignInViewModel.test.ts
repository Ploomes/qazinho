// @vitest-environment jsdom
import type { ProSignInProgress } from '@/shared/types';
import { renderHook } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useProSignInViewModel } from '@/modules/Pro/components/ProSignIn/hooks/useProSignInViewModel';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

const STEPS: ProSignInProgress['steps'] = ['code', 'browser', 'account'];

function view(progress: ProSignInProgress) {
  const props = { progress, onCancel: vi.fn(), onClose: vi.fn(), onRetry: vi.fn() };

  return { props, result: renderHook(() => useProSignInViewModel(props)).result };
}

describe('useProSignInViewModel', () => {
  it('shows the code to check in the browser, and the page it opened, once the platform gave them', () => {
    const { result } = view({
      steps: STEPS,
      phase: 'working',
      at: 'browser',
      code: 'WDJB-MJHT',
      url: 'https://qazinho.salvesoftware.com/device?code=WDJB-MJHT',
    });

    expect(result.current.shownCode).toMatchObject({ code: 'WDJB-MJHT' });
    expect(result.current.page).toMatchObject({
      url: 'https://qazinho.salvesoftware.com/device?code=WDJB-MJHT',
    });
    expect(result.current.rows.map(({ state }) => state)).toEqual([
      'done',
      'active',
      'pending',
    ]);
    expect(result.current.actions.map(({ key }) => key)).toEqual(['cancel']);
  });

  it('does NOT show a code before the platform handed one', () => {
    const { result } = view({
      steps: STEPS,
      phase: 'working',
      at: 'code',
      code: null,
      url: null,
    });

    expect(result.current.shownCode).toBeNull();
    expect(result.current.hint).toBeNull();
  });

  it('names the account once signed in, and offers to close', () => {
    const { result, props } = view({
      steps: STEPS,
      phase: 'connected',
      account: 'ana@loja.dev',
    });

    expect(result.current.subtitle).toBe('Signed in as ana@loja.dev.');
    expect(result.current.rows.every(({ state }) => state === 'done')).toBe(true);

    result.current.actions[0]?.onClick();

    expect(props.onClose).toHaveBeenCalled();
  });

  it('says why it stopped and offers to try again', () => {
    const { result } = view({
      steps: STEPS,
      phase: 'failed',
      at: 'browser',
      failure: 'expired',
    });

    expect(result.current.subtitle).toBe(
      'The code expired before it was confirmed. Try again for a new one.',
    );
    expect(result.current.rows.map(({ state }) => state)).toEqual([
      'done',
      'failed',
      'pending',
    ]);
    expect(result.current.actions.map(({ key }) => key)).toEqual(['close', 'retry']);
  });

  it('does NOT offer to try again on a computer with no keychain', () => {
    const { result } = view({
      steps: STEPS,
      phase: 'failed',
      at: 'code',
      failure: 'no-keychain',
    });

    expect(result.current.actions.map(({ key }) => key)).toEqual(['close']);
  });
});
