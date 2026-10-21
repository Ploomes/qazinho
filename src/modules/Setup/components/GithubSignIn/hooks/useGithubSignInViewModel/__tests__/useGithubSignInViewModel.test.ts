// @vitest-environment jsdom
import type { GithubSignInProgress } from '@/shared/types';
import { renderHook } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { i18n } from '@/languages';
import { useGithubSignInViewModel } from '@/modules/Setup/components/GithubSignIn/hooks/useGithubSignInViewModel';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

const STEPS: GithubSignInProgress['steps'] = ['code', 'browser', 'account'];

function view(progress: GithubSignInProgress) {
  const props = { progress, onCancel: vi.fn(), onClose: vi.fn(), onRetry: vi.fn() };

  return { props, result: renderHook(() => useGithubSignInViewModel(props)).result };
}

describe('useGithubSignInViewModel', () => {
  it('shows the one-time code to copy, and the page it goes to, once gh printed them', () => {
    const { result } = view({
      steps: STEPS,
      phase: 'working',
      at: 'browser',
      code: 'AA0B-11E8',
      url: 'https://github.com/login/device',
    });

    expect(result.current.shownCode).toMatchObject({ code: 'AA0B-11E8' });
    expect(result.current.page).toMatchObject({ url: 'https://github.com/login/device' });
    expect(result.current.rows.map(({ state }) => state)).toEqual([
      'done',
      'active',
      'pending',
    ]);
    expect(result.current.actions.map(({ key }) => key)).toEqual(['cancel']);
  });

  it('does NOT show a code before gh printed one', () => {
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

  it('names the account once connected, and offers to close', () => {
    const { result, props } = view({
      steps: STEPS,
      phase: 'connected',
      account: 'octoqa',
    });

    expect(result.current.subtitle).toBe('Signed in as octoqa.');
    expect(result.current.rows.every(({ state }) => state === 'done')).toBe(true);

    result.current.actions[0]?.onClick();

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('offers to try again after GitHub refused, but not when gh is missing', () => {
    const refused = view({
      steps: STEPS,
      phase: 'failed',
      at: 'browser',
      failure: 'refused',
      said: 'authorization denied',
    }).result.current;

    expect(refused.actions.map(({ key }) => key)).toEqual(['close', 'retry']);
    expect(refused.detail).toEqual({ text: 'authorization denied', isCommand: false });

    const missing = view({
      steps: STEPS,
      phase: 'failed',
      at: 'code',
      failure: 'missing',
      said: '',
    }).result.current;

    expect(missing.actions.map(({ key }) => key)).toEqual(['close']);
    expect(missing.detail).toBeNull();
  });
});
