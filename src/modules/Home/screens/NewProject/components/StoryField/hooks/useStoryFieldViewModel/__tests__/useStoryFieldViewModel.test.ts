// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStoryFieldViewModel } from '@/modules/Home/screens/NewProject/components/StoryField/hooks';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSetupStore } from '@/store';

const ISSUE = {
  key: 'SHOP-892',
  summary: 'Frete grátis acima de R$ 200',
  url: 'https://acme.atlassian.net/browse/SHOP-892',
};
const PAGE = {
  id: '42',
  title: 'Casos do checkout',
  space: 'Loja',
  url: 'https://acme.atlassian.net/wiki/spaces/LOJA/pages/42/Casos',
};
const JIRA = {
  id: 'jira' as const,
  account: 'ana@acme.test',
  site: 'acme',
  connectedAt: '',
};

beforeEach(() => {
  useSetupStore.setState({ integrations: [JIRA] });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useStoryFieldViewModel', () => {
  it('reads a story by its key, from a link too', async () => {
    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      searchJira: () => Promise.resolve({ isListed: true as const, issues: [ISSUE] }),
    };
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useStoryFieldViewModel({ value: null, onChange }),
    );

    act(() => {
      result.current.onText('https://acme.atlassian.net/browse/shop-892');
    });
    act(() => {
      result.current.onRead();
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({ kind: 'jira', issue: ISSUE });
    });
  });

  it('says a key Jira does not have was not found', async () => {
    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      searchJira: () => Promise.resolve({ isListed: true as const, issues: [] }),
    };
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useStoryFieldViewModel({ value: null, onChange }),
    );

    act(() => {
      result.current.onText('SHOP-1');
    });
    act(() => {
      result.current.onRead();
    });

    await waitFor(() => {
      expect(result.current.statusText).toBe('Nothing found by that.');
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reads a Confluence page by its link when Confluence is on', async () => {
    useSetupStore.setState({ integrations: [{ ...JIRA, confluence: true }] });
    window.qazinho = {
      ...fakeQazinhoApi('darwin'),
      searchConfluence: () => Promise.resolve({ isListed: true as const, pages: [PAGE] }),
    };
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useStoryFieldViewModel({ value: null, onChange }),
    );

    act(() => {
      result.current.onText(PAGE.url);
    });
    act(() => {
      result.current.onRead();
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({ kind: 'page', page: PAGE });
    });
  });

  it('offers to connect Jira in place, and reads nothing without it', () => {
    useSetupStore.setState({ integrations: [] });

    const { result } = renderHook(() =>
      useStoryFieldViewModel({ value: null, onChange: vi.fn() }),
    );

    expect(result.current).toMatchObject({
      needsJira: true,
      hasIntegration: true,
      statusText: 'Connect Jira to read the story.',
    });
  });

  it('lets go of the story it read once the QA types something else', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useStoryFieldViewModel({ value: { kind: 'jira', issue: ISSUE }, onChange }),
    );

    expect(result.current.statusText).toBe('SHOP-892 · Frete grátis acima de R$ 200');

    act(() => {
      result.current.onText('SHOP-893');
    });

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
