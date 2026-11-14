// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUpdateRequiredViewModel } from '@/modules/Update/screens/UpdateRequired/hooks/useUpdateRequiredViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { NO_UPDATE } from '@/services/Updates';
import { useUpdateStore } from '@/store';
import '@/languages';

const mount = () => renderHook(() => useUpdateRequiredViewModel()).result.current;

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
  useUpdateStore.setState({ update: NO_UPDATE });
});

describe('useUpdateRequiredViewModel', () => {
  it('looks for the version before it knows of one', () => {
    useUpdateStore.setState({ update: { phase: 'idle', isRequired: true } });

    expect(mount()).toMatchObject({ isWorking: true, isReady: false, isFailed: false });
  });

  it('shows how far the download went', () => {
    useUpdateStore.setState({
      update: { phase: 'downloading', version: '0.2.0', percent: 40, isRequired: true },
    });

    const view = mount();

    expect(view.isWorking).toBe(true);
    expect(view.workingLabel).toContain('40');
    expect(view.barStyle).toEqual({ '--update-progress': '0.4' });
  });

  it('says it is restarting after the click, with the bar full', () => {
    useUpdateStore.setState({ update: { phase: 'installing', isRequired: true } });

    const view = mount();

    expect(view.isWorking).toBe(true);
    expect(view.isReady).toBe(false);
    expect(view.barStyle).toEqual({ '--update-progress': '1' });
  });

  it('restarts into the new version once it is ready', () => {
    const installUpdate = vi.fn(() => Promise.resolve());

    window.qazinho = { ...fakeQazinhoApi('darwin'), installUpdate };
    useUpdateStore.setState({
      update: { phase: 'ready', version: '0.2.0', isRequired: true },
    });

    const view = mount();

    expect(view.isReady).toBe(true);
    expect(view.isWorking).toBe(false);

    view.onRestart();

    expect(installUpdate).toHaveBeenCalledOnce();
  });

  // Rede da empresa, Linux fora de um AppImage: sem isto a tela seria um beco sem saída.
  it('offers the site when it cannot update from here', () => {
    const openProPage = vi.fn(() => Promise.resolve(true));

    window.qazinho = { ...fakeQazinhoApi('darwin'), openProPage };
    useUpdateStore.setState({ update: { phase: 'failed', isRequired: true } });

    const view = mount();

    expect(view.isFailed).toBe(true);
    expect(view.isWorking).toBe(false);

    view.onDownload();

    expect(openProPage).toHaveBeenCalledWith('/download');
  });

  // Uma cópia da Microsoft Store não baixa nada sozinha: quem a atualiza é a loja.
  it('sends a copy from the Microsoft Store to the store, not to the site', () => {
    const openStoreUpdates = vi.fn(() => Promise.resolve());
    const openProPage = vi.fn(() => Promise.resolve(true));

    window.qazinho = { ...fakeQazinhoApi('win32'), openStoreUpdates, openProPage };
    useUpdateStore.setState({ update: { phase: 'store', isRequired: true } });

    const view = mount();

    expect(view).toMatchObject({ isStore: true, isWorking: false, isFailed: false });

    view.onOpenStore();

    expect(openStoreUpdates).toHaveBeenCalledOnce();
    expect(openProPage).not.toHaveBeenCalled();
  });
});
