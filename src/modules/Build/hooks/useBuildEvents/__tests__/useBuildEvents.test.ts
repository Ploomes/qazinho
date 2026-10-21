// @vitest-environment jsdom
import type { IBuild } from '@/modules/Build/types';
import type { IBuildEvent } from '@/shared/types';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { i18n } from '@/languages';
import { useBuildEvents } from '@/modules/Build/hooks/useBuildEvents';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useBuildStore } from '@/store';

const BUILD: IBuild = {
  id: 'b1',
  projectId: 'p1',
  platform: 'ios',
  repository: 'acme/loja-app',
  branch: 'main',
  startedAt: 0,
  phase: 'working',
  step: 'agent',
  bytes: 0,
  lines: [],
  result: null,
};

/** The build events as main sends them. */
function bridge() {
  let hear: (event: IBuildEvent) => void = () => undefined;

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    onBuildEvent: (listener) => {
      hear = listener;

      return () => undefined;
    },
  };

  return { send: (event: IBuildEvent) => hear(event) };
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  useBuildStore.setState({ builds: [BUILD] });
  useAppStore.setState({
    projects: [
      {
        id: 'p1',
        name: 'Lojinha',
        targets: [{ id: 't1', kind: 'web', label: 'Web', value: 'https://loja.test' }],
        repositories: [],
      },
    ],
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useBuildEvents', () => {
  it('follows a build as main tells it', () => {
    const { send } = bridge();

    renderHook(() => {
      useBuildEvents();
    });
    act(() => {
      send({ kind: 'line', buildId: 'b1', text: '$ pod install' });
    });

    expect(useBuildStore.getState().builds[0]?.lines).toEqual(['$ pod install']);
  });

  it('sets what was built as the target of the project it was built for', () => {
    const { send } = bridge();

    renderHook(() => {
      useBuildEvents();
    });
    act(() => {
      send({
        kind: 'ended',
        buildId: 'b1',
        result: {
          isBuilt: true,
          artifact: '/apps/p1/Loja.app',
          bytes: 9,
          commit: 'c0ffee1',
          summary: '',
        },
      });
    });

    expect(useAppStore.getState().projects[0]?.targets.at(-1)).toEqual({
      id: 't-ios',
      kind: 'ios',
      label: 'iOS',
      value: '/apps/p1/Loja.app',
    });
  });

  it('does NOT touch a project when the build failed, or was for none', () => {
    const { send } = bridge();

    useBuildStore.setState({ builds: [BUILD, { ...BUILD, id: 'b2', projectId: null }] });
    renderHook(() => {
      useBuildEvents();
    });
    act(() => {
      send({
        kind: 'ended',
        buildId: 'b1',
        result: { isBuilt: false, failure: { reason: 'stopped' } },
      });
      send({
        kind: 'ended',
        buildId: 'b2',
        result: {
          isBuilt: true,
          artifact: '/apps/drafts/Loja.app',
          bytes: 9,
          commit: 'c0ffee1',
          summary: '',
        },
      });
    });

    expect(useAppStore.getState().projects[0]?.targets).toHaveLength(1);
  });
});
