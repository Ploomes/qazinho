// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAppViewModel } from '@/app/hooks/useAppViewModel';
import { useAppStore, useSettingsStore } from '@/store';

describe('useAppViewModel', () => {
  beforeEach(() => {
    useAppStore.setState({ theme: 'dark', screen: 'welcome', projects: [] });
    useSettingsStore.setState({ hasOnboarded: true });
  });

  it('opens on the first-run setup until the QA finished or skipped it', () => {
    useSettingsStore.setState({ hasOnboarded: false });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isOnboarding).toBe(true);
  });

  it('does NOT show the setup again once it was done', () => {
    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isOnboarding).toBe(false);
  });

  it('opens on the welcome screen while there is nothing to test', () => {
    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isWelcome).toBe(true);
  });

  it('writes the theme on the document, because the tokens hang off it', () => {
    useAppStore.setState({ theme: 'light' });

    renderHook(() => useAppViewModel());

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('is not the welcome screen once a workspace is open', () => {
    useAppStore.setState({
      screen: 'workspace',
      projects: [{ id: 'p1', name: 'Shop · staging', targets: [] }],
    });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isWelcome).toBe(false);
  });

  it('keeps the welcome screen while there is no project, whatever the screen says', () => {
    useAppStore.setState({ screen: 'workspace', projects: [] });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isWelcome).toBe(true);
  });

  it('hides the app sidebar while settings take the whole window', () => {
    useAppStore.setState({
      screen: 'settings',
      projects: [{ id: 'p1', name: 'Shop · staging', targets: [] }],
    });

    const { result } = renderHook(() => useAppViewModel());

    expect(result.current.isSettings).toBe(true);
    expect(result.current.hasSidebar).toBe(false);
  });

  it('mounts the lightbox only while there is media, so its exit can play', () => {
    useAppStore.setState({ media: null });

    expect(renderHook(() => useAppViewModel()).result.current.hasMedia).toBe(false);

    useAppStore.setState({
      media: { kicker: 'r-01', title: 'step 1', isTall: false, src: null, file: null },
    });

    expect(renderHook(() => useAppViewModel()).result.current.hasMedia).toBe(true);
  });
});
