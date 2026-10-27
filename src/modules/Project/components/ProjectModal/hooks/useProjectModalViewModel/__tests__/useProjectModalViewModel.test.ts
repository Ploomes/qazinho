// @vitest-environment jsdom
import type { IApplyVariables, IProShare, ProStatus } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProjectModalViewModel } from '@/modules/Project/components/ProjectModal/hooks/useProjectModalViewModel';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import {
  useAppStore,
  useBuildStore,
  useMachineStore,
  useProStore,
  useSetupStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

beforeEach(() => {
  window.qazinho = fakeQazinhoApi('darwin');
  useAppStore.setState({
    projects: [],
    modal: 'project',
    editingProjectId: null,
    projectSection: null,
    selectedWorkspaceId: null,
    screen: 'welcome',
  });
  useWorkspaceStore.setState({ workspaces: [] });
  useSetupStore.setState({ integrations: [] });
  useBuildStore.setState({ builds: [] });
  useVariablesStore.setState({ byProject: {}, request: null, settled: null });
  useProStore.setState({ status: null, shares: [] });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useProjectModalViewModel', () => {
  it('cannot create a project with no name and no target', () => {
    const { result } = renderHook(() => useProjectModalViewModel());

    expect(result.current.canConfirm).toBe(false);
  });

  it('cannot create a project that has a name but nothing to test', () => {
    const { result } = renderHook(() => useProjectModalViewModel());

    act(() => {
      result.current.onNameChange('Shop · staging');
    });

    expect(result.current.canConfirm).toBe(false);
  });

  it('creates the project with the targets that were filled in', () => {
    const { result } = renderHook(() => useProjectModalViewModel());

    act(() => {
      result.current.onNameChange('Shop · staging');
      result.current.onUrlChange('https://staging.shop.test');
    });
    act(() => {
      result.current.onConfirm();
    });

    const [project] = useAppStore.getState().projects;

    expect(project?.name).toBe('Shop · staging');
    expect(project?.targets).toHaveLength(1);
    expect(project?.targets[0]?.kind).toBe('web');
  });

  it('keeps the repositories the project is made of, and none when none were picked', () => {
    const { result } = renderHook(() => useProjectModalViewModel());

    act(() => {
      result.current.onNameChange('Shop · staging');
      result.current.onUrlChange('https://staging.shop.test');
      result.current.onRepositoriesChange([
        { id: '202', owner: 'acme', name: 'shop-web', baseBranch: 'develop' },
      ]);
    });
    act(() => {
      result.current.onConfirm();
    });

    expect(useAppStore.getState().projects[0]?.repositories).toEqual([
      { id: '202', owner: 'acme', name: 'shop-web', baseBranch: 'develop' },
    ]);
    expect(
      renderHook(() => useProjectModalViewModel()).result.current.repositories,
    ).toEqual([]);
  });

  it('goes straight on to the first workspace of the new project', () => {
    const { result } = renderHook(() => useProjectModalViewModel());

    act(() => {
      result.current.onNameChange('Shop · staging');
      result.current.onUrlChange('https://staging.shop.test');
    });
    act(() => {
      result.current.onConfirm();
    });

    const [project] = useAppStore.getState().projects;

    expect(useAppStore.getState()).toMatchObject({
      modal: 'workspace',
      selectedProjectId: project?.id,
    });
  });

  describe('sections', () => {
    it('opens on the name and the targets', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.section).toBe('general');
      expect(result.current.isOpen).toEqual({
        general: true,
        code: false,
        variables: false,
        automation: false,
        pro: false,
        delete: false,
      });
    });

    it('opens the section picked in the nav, and only that one', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onSelectSection('variables');
      });

      expect(result.current.isOpen).toEqual({
        general: false,
        code: false,
        variables: true,
        automation: false,
        pro: false,
        delete: false,
      });
    });

    it('does NOT offer deleting a project that is not made yet', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.navItems.map(({ id }) => id)).toEqual([
        'general',
        'code',
        'variables',
        'automation',
      ]);
    });

    it('counts the repositories and the variables a project holds, and nothing it does not', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.navItems.map(({ count }) => count)).toEqual([
        null,
        null,
        null,
        null,
      ]);

      act(() => {
        result.current.onRepositoriesChange([
          { id: '202', owner: 'acme', name: 'shop-web', baseBranch: 'main' },
          { id: '203', owner: 'acme', name: 'shop-api', baseBranch: 'main' },
        ]);
        result.current.onVariablesChange([
          {
            key: 'k1',
            name: 'LOGIN_EMAIL',
            description: '',
            value: 'a@b.test',
            from: null,
          },
        ]);
      });

      expect(result.current.navItems.map(({ count }) => count)).toEqual([
        null,
        2,
        1,
        null,
      ]);
    });

    it('flags the general section while it keeps the project from being made', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.navItems.map(({ isFlagged }) => isFlagged)).toEqual([
        true,
        false,
        false,
        false,
      ]);

      act(() => {
        result.current.onNameChange('Shop · staging');
        result.current.onUrlChange('https://staging.shop.test');
      });

      expect(result.current.navItems.some(({ isFlagged }) => isFlagged)).toBe(false);
    });
  });

  describe('locks', () => {
    it('locks iOS behind setting up Xcode when this Mac has none', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.isMac).toBe(true);
      expect(result.current.iosLock).toMatchObject({
        reason: 'Needs Xcode on this Mac',
        setUp: {
          label: 'Set up iOS',
          link: { url: expect.stringContaining('apps.apple.com') },
        },
      });
    });

    it('locks iOS with nothing to set up away from a Mac', () => {
      window.qazinho = fakeQazinhoApi('win32');

      expect(renderHook(() => useProjectModalViewModel()).result.current.iosLock).toEqual(
        {
          reason: 'Testing iOS needs a Mac',
          setUp: null,
        },
      );
    });

    it('locks Android behind setting up the SDK when this machine has none', () => {
      expect(
        renderHook(() => useProjectModalViewModel()).result.current.androidLock,
      ).toMatchObject({
        setUp: {
          label: 'Set up Android',
          link: { url: expect.stringContaining('android.com') },
        },
      });
    });

    it('frees a target once its tools are found', () => {
      useMachineStore.setState({
        tools: {
          androidSdk: { isFound: true, path: '/sdk' },
          xcode: { isFound: true, path: '/Applications/Xcode.app' },
          idb: { isFound: false, path: null },
        },
      });

      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.androidLock).toBeNull();
      expect(result.current.iosLock).toBeNull();
    });

    it('does NOT lock a target the project already has, so it can still be changed or cleared', () => {
      useAppStore.setState({
        editingProjectId: 'p1',
        projects: [
          {
            id: 'p1',
            name: 'Shop',
            targets: [
              { id: 't-android', kind: 'android', label: 'Android', value: '/x/app.apk' },
            ],
            repositories: [],
          },
        ],
      });

      expect(
        renderHook(() => useProjectModalViewModel()).result.current.androidLock,
      ).toBeNull();
    });
  });

  describe('footerHint', () => {
    it('says what is missing first, which is the name', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.footerHint).toBe('Name the project to create it');
    });

    it('asks for a target once the project has a name', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onNameChange('Shop · staging');
      });

      expect(result.current.footerHint).toBe('Add one target: a URL, an .apk or a .app');
    });

    it('says when the web address is not one a browser could open', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onNameChange('Shop · staging');
        result.current.onUrlChange('my shop');
      });

      expect(result.current.footerHint).toBe(
        'That is not a web address: write it the way you would in a browser, like staging.yourshop.com',
      );
      expect(result.current.canConfirm).toBe(false);
    });

    it('saves an address typed without its scheme the way a browser opens it', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onNameChange('Shop · staging');
        result.current.onUrlChange('staging.shop.com');
      });
      act(() => {
        result.current.onConfirm();
      });

      expect(useAppStore.getState().projects.at(-1)?.targets[0]?.value).toBe(
        'https://staging.shop.com',
      );
    });

    it('says nothing once the button can be pressed', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onNameChange('Shop · staging');
        result.current.onUrlChange('https://staging.shop.test');
      });

      expect(result.current.footerHint).toBeUndefined();
      expect(result.current.canConfirm).toBe(true);
    });
  });

  describe('editing a project', () => {
    const SAVED = {
      id: 'p1',
      name: 'Shop · staging',
      targets: [
        { id: 't-web', kind: 'web' as const, label: 'Web', value: 'https://a.test' },
      ],
      repositories: [],
    };

    beforeEach(() => {
      useAppStore.setState({ projects: [SAVED], editingProjectId: 'p1' });
    });

    it('opens with what the project already has', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.isEditing).toBe(true);
      expect(result.current.name).toBe('Shop · staging');
      expect(result.current.url).toBe('https://a.test');
      expect(result.current.confirmLabel).toBe('Save changes');
    });

    it("opens on its suite when asked from the suite's screen", () => {
      useAppStore.getState().openSuiteSettings('p1');

      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.section).toBe('automation');
    });

    it('stays on the project while it animates out, after the store has let go', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onCancel();
      });

      expect(useAppStore.getState().editingProjectId).toBeNull();
      expect(result.current.title).toBe('Project settings');
      expect(result.current.confirmLabel).toBe('Save changes');
    });

    it('saves in place and keeps the target id a workspace points at', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onNameChange('Shop · production');
        result.current.onUrlChange('  https://b.test  ');
      });
      act(() => {
        result.current.onConfirm();
      });

      expect(useAppStore.getState().projects).toEqual([
        {
          ...SAVED,
          name: 'Shop · production',
          targets: [{ ...SAVED.targets[0], value: 'https://b.test' }],
          repositories: [],
        },
      ]);
    });

    /** Targets used to be saved as "Android · Pixel 7" and "iOS · iPhone 16", phones nobody picked. */
    it('names a target in use by its platform, whatever an older project saved', () => {
      useAppStore.setState({
        projects: [
          {
            ...SAVED,
            targets: [
              { ...SAVED.targets[0]!, label: 'Web · staging' },
              { id: 't-android', kind: 'android', label: 'Android', value: '/x/app.apk' },
            ],
            repositories: [],
          },
        ],
      });
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), projectId: 'p1', targetId: 't-web' }],
      });

      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onUrlChange('');
      });

      expect(result.current.footerHint).toBe(
        'A workspace runs against Web, so it cannot go empty',
      );
    });

    it('saves a target under its platform name, dropping a phone an older project made up', () => {
      useAppStore.setState({
        projects: [
          {
            ...SAVED,
            targets: [
              ...SAVED.targets,
              {
                id: 't-android',
                kind: 'android' as const,
                label: 'Android · Pixel 7',
                value: '/x/app.apk',
              },
            ],
            repositories: [],
          },
        ],
      });

      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onConfirm();
      });

      expect(
        useAppStore.getState().projects[0]?.targets.map(({ label }) => label),
      ).toEqual(['Web', 'Android']);
    });

    it('does NOT let a target a workspace runs against go empty', () => {
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), projectId: 'p1', targetId: 't-web' }],
      });

      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onUrlChange('');
      });

      expect(result.current.canConfirm).toBe(false);
    });

    it('says what goes with the project before it is deleted, then takes the workspaces with it', () => {
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace(), id: 'w1', projectId: 'p1' },
          { ...makeWorkspace(), id: 'w2', projectId: 'p2' },
        ],
      });
      useAppStore.setState({ selectedWorkspaceId: 'w1', screen: 'workspace' });
      useVariablesStore.setState({
        byProject: {
          p1: [
            { name: 'LOGIN_EMAIL', description: 'The admin account' },
            { name: 'LOGIN_PASSWORD', description: 'Its password' },
          ],
        },
      });

      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onSelectSection('delete');
      });

      expect(result.current.isOpen.delete).toBe(true);
      expect(result.current).toMatchObject({
        deleteTitle: 'Delete Shop · staging',
        deleteText: 'The project leaves this machine for good, and takes with it:',
        losses: [
          'its workspace, with the plan, chat, runs and bugs',
          'the 2 variables it keeps, values and all',
        ],
        hasLosses: true,
      });
      expect(useAppStore.getState().projects).toHaveLength(1);

      act(() => {
        result.current.onDelete();
      });

      expect(useAppStore.getState().projects).toEqual([]);
      expect(useAppStore.getState().screen).toBe('welcome');
      expect(useWorkspaceStore.getState().workspaces.map(({ id }) => id)).toEqual(['w2']);
    });

    it('says a project with nothing in it goes alone', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current).toMatchObject({
        deleteText:
          'The project leaves this machine for good. It has no workspace or variable to take with it.',
        losses: [],
        hasLosses: false,
      });
    });

    it('counts the workspaces that go, once there are more than one', () => {
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace(), id: 'w1', projectId: 'p1' },
          { ...makeWorkspace(), id: 'w2', projectId: 'p1' },
        ],
      });

      expect(renderHook(() => useProjectModalViewModel()).result.current.losses).toEqual([
        'its 2 workspaces, with their plans, chats, runs and bugs',
      ]);
    });

    it('offers deleting at the foot of the nav', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.navItems.at(-1)).toMatchObject({
        id: 'delete',
        label: 'Delete project',
        isDanger: true,
      });
    });

    it('stops what each of its workspaces had going, its run and its agent', () => {
      const stopRun = vi.fn(() => Promise.resolve());
      const stopAgent = vi.fn(() => Promise.resolve());

      window.qazinho = { ...fakeQazinhoApi('darwin'), stopRun, stopAgent };
      useWorkspaceStore.setState({
        workspaces: [{ ...makeWorkspace(), id: 'w1', projectId: 'p1' }],
      });

      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onDelete();
      });

      expect(stopRun).toHaveBeenCalledWith('w1');
      expect(stopAgent).toHaveBeenCalledWith('w1');
    });
  });
  describe('QAzinho Pro', () => {
    const SAVED = {
      id: 'p1',
      name: 'Shop · staging',
      targets: [
        { id: 't-web', kind: 'web' as const, label: 'Web', value: 'https://a.test' },
      ],
      repositories: [],
    };
    const signedInAs = (role: 'owner' | 'admin' | 'editor'): ProStatus => ({
      isSignedIn: true,
      account: { email: 'ana@loja.dev', name: 'Ana' },
      machine: { id: 'm1', name: 'MacBook-Ana' },
      orgs: [{ slug: 'loja', name: 'Loja Online', role, billingStatus: 'active' }],
      isReachable: true,
    });
    const LINKED: IProShare = {
      projectId: 'p1',
      orgSlug: 'loja',
      state: 'synced',
      syncedAt: null,
      pending: [],
      conflicts: [],
    };

    beforeEach(() => {
      useAppStore.setState({ projects: [SAVED], editingProjectId: 'p1' });
    });

    it('offers the QAzinho Pro section once signed in, before deleting', () => {
      const signedOut = renderHook(() => useProjectModalViewModel()).result.current;

      expect(signedOut.navItems.map(({ id }) => id)).not.toContain('pro');

      useProStore.setState({ status: signedInAs('editor') });

      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.navItems.map(({ id }) => id).slice(-2)).toEqual([
        'pro',
        'delete',
      ]);

      act(() => {
        result.current.onSelectSection('pro');
      });

      expect(result.current.isOpen.pro).toBe(true);
    });

    it('does NOT offer the section while making a project', () => {
      useAppStore.setState({ editingProjectId: null });
      useProStore.setState({ status: signedInAs('owner') });

      expect(
        renderHook(() => useProjectModalViewModel()).result.current.navItems.map(
          ({ id }) => id,
        ),
      ).not.toContain('pro');
    });

    it('says a linked project stays in its org, and unlinks it before it goes from here', async () => {
      const unlinkPro = vi.fn((projectId: string) =>
        Promise.resolve({ ...LINKED, projectId, orgSlug: null, state: 'off' as const }),
      );
      const removeProProject = vi.fn(() => Promise.resolve({ isRemoved: true as const }));

      window.qazinho = { ...fakeQazinhoApi('darwin'), unlinkPro, removeProProject };
      useProStore.setState({ status: signedInAs('editor'), shares: [LINKED] });

      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current).toMatchObject({
        hasDeleteInOrg: false,
        hasDeleteOrgNote: true,
        deleteOrgNote: 'It stays in Loja Online; only this computer’s copy goes.',
      });

      act(() => {
        result.current.onDelete();
      });

      await waitFor(() => {
        expect(useAppStore.getState().projects).toEqual([]);
      });
      expect(unlinkPro).toHaveBeenCalledWith('p1');
      expect(removeProProject).not.toHaveBeenCalled();
      expect(useProStore.getState().shares).toEqual([]);
    });

    it('lets an owner delete the project in the org too, which goes first', async () => {
      const removeProProject = vi.fn(() => Promise.resolve({ isRemoved: true as const }));

      window.qazinho = { ...fakeQazinhoApi('darwin'), removeProProject };
      useProStore.setState({ status: signedInAs('owner'), shares: [LINKED] });

      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.hasDeleteInOrg).toBe(true);
      expect(result.current.isDeleteInOrgOn).toBe(false);

      act(() => {
        result.current.onDeleteInOrgChange(true);
      });

      expect(result.current.deleteOrgNote).toBe(
        'Its plans, runs and bugs go for everyone in Loja Online.',
      );

      act(() => {
        result.current.onDelete();
      });

      await waitFor(() => {
        expect(useAppStore.getState().projects).toEqual([]);
      });
      expect(removeProProject).toHaveBeenCalledWith('p1');
    });

    it('deletes nothing when the org refuses, and says why', async () => {
      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        removeProProject: () =>
          Promise.resolve({ isRemoved: false as const, failure: 'busy' as const }),
      };
      useProStore.setState({ status: signedInAs('admin'), shares: [LINKED] });

      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onDeleteInOrgChange(true);
      });
      act(() => {
        result.current.onDelete();
      });

      await waitFor(() => {
        expect(result.current.hasDeleteFailure).toBe(true);
      });
      expect(result.current.deleteFailure).toBe(
        'A CI job of this project is still going in Loja Online. Try again once it ends.',
      );
      expect(useAppStore.getState().projects).toHaveLength(1);
      expect(result.current.canDelete).toBe(true);
    });

    it('does NOT offer deleting in the org to an editor, nor speak of an org for a local project', () => {
      useProStore.setState({ status: signedInAs('editor'), shares: [] });

      expect(renderHook(() => useProjectModalViewModel()).result.current).toMatchObject({
        hasDeleteInOrg: false,
        hasDeleteOrgNote: false,
      });
    });
  });

  describe('building from the code', () => {
    const SAVED = {
      id: 'p1',
      name: 'Lojinha',
      targets: [
        { id: 't1', kind: 'web' as const, label: 'Web', value: 'https://loja.test' },
      ],
      repositories: [{ id: '102', owner: 'acme', name: 'loja-app', baseBranch: 'main' }],
    };
    const BUILT = {
      id: 'b1',
      projectId: 'p1',
      platform: 'android' as const,
      repository: 'acme/loja-app',
      branch: 'main',
      startedAt: 0,
      phase: 'built' as const,
      step: 'artifact' as const,
      bytes: 0,
      lines: [],
      result: {
        isBuilt: true as const,
        artifact: '/apps/p1/loja.apk',
        bytes: 9,
        commit: 'c0ffee1',
        summary: '',
      },
    };

    beforeEach(() => {
      useAppStore.setState({ projects: [SAVED], editingProjectId: 'p1' });
      useSetupStore.setState({
        integrations: [{ id: 'github', account: 'octoqa', site: null, connectedAt: '' }],
      });
    });

    it('offers it once GitHub is connected and the project names a repository', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.androidBuilder.isShown).toBe(true);

      act(() => {
        useSetupStore.setState({ integrations: [] });
      });

      expect(result.current.androidBuilder.isShown).toBe(false);
    });

    it('takes what a build started here made as the target it fills', () => {
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        useBuildStore.setState({ builds: [BUILT] });
        result.current.androidBuilder.onStart('b1');
      });

      expect(result.current.apk).toBe('/apps/p1/loja.apk');
      expect(result.current.canConfirm).toBe(true);
    });

    it('follows a build of this project that started elsewhere, while it goes', () => {
      useBuildStore.setState({ builds: [{ ...BUILT, phase: 'working', result: null }] });

      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.androidBuilder.buildId).toBe('b1');
      expect(result.current.iosBuilder.buildId).toBeNull();
    });

    it('lets a file the QA picks win over a build', async () => {
      window.qazinho.pickFile = vi.fn().mockResolvedValue('/Downloads/picked.apk');

      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        useBuildStore.setState({ builds: [BUILT] });
        result.current.androidBuilder.onStart('b1');
      });
      act(() => {
        result.current.onPickApk();
      });

      await vi.waitFor(() => {
        expect(result.current.apk).toBe('/Downloads/picked.apk');
      });
      expect(result.current.androidBuilder.buildId).toBeNull();
    });
  });
  describe('the variables', () => {
    const SHOP = {
      id: 'p1',
      name: 'Shop',
      targets: [
        { id: 't-web', kind: 'web' as const, label: 'Web', value: 'https://shop.test' },
      ],
      repositories: [],
    };

    /** A vault that keeps what it was asked, and answers `isSaved` as told. */
    function vault(isSaved = true) {
      const applied: IApplyVariables[] = [];

      window.qazinho = {
        ...fakeQazinhoApi('darwin'),
        applyVariables: (apply) => {
          applied.push(apply);

          return Promise.resolve(
            isSaved
              ? { isSaved: true, variables: [] }
              : { isSaved: false, failure: { reason: 'no-keychain' } },
          );
        },
      };

      return applied;
    }

    it('opens on the variables the project keeps, each value left sealed', () => {
      useAppStore.setState({ projects: [SHOP], editingProjectId: 'p1' });
      useVariablesStore.setState({
        byProject: { p1: [{ name: 'LOGIN_EMAIL', description: 'The admin' }] },
      });

      const { result } = renderHook(() => useProjectModalViewModel());

      expect(result.current.variables).toEqual([
        {
          key: 'saved-LOGIN_EMAIL',
          name: 'LOGIN_EMAIL',
          description: 'The admin',
          value: '',
          from: 'LOGIN_EMAIL',
        },
      ]);
    });

    it('seals what changed before it saves the project', async () => {
      const applied = vault();

      useAppStore.setState({ projects: [SHOP], editingProjectId: 'p1' });

      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onVariablesChange([
          { key: 'new-0', name: 'TOKEN', description: 'API', value: 'abc', from: null },
        ]);
      });
      act(() => {
        result.current.onConfirm();
      });

      await waitFor(() => {
        expect(useAppStore.getState().modal).toBeNull();
      });
      expect(applied).toEqual([
        {
          projectId: 'p1',
          changes: [
            { kind: 'save', name: 'TOKEN', description: 'API', value: 'abc', from: null },
          ],
        },
      ]);
    });

    it('gives a new project its variables under the id it is created with', async () => {
      const applied = vault();
      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onNameChange('Shop');
        result.current.onUrlChange('https://shop.test');
        result.current.onVariablesChange([
          { key: 'new-0', name: 'TOKEN', description: '', value: 'abc', from: null },
        ]);
      });
      act(() => {
        result.current.onConfirm();
      });

      await waitFor(() => {
        expect(useAppStore.getState().projects).toHaveLength(1);
      });
      expect(applied[0]?.projectId).toBe(useAppStore.getState().projects[0]?.id);
    });

    it('does NOT save the project when the variables could not be sealed, and says why', async () => {
      vault(false);
      useAppStore.setState({ projects: [SHOP], editingProjectId: 'p1' });

      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onVariablesChange([
          { key: 'new-0', name: 'TOKEN', description: '', value: 'abc', from: null },
        ]);
      });
      act(() => {
        result.current.onConfirm();
      });

      await waitFor(() => {
        expect(result.current.footerHint).toContain('no keychain');
      });
      expect(useAppStore.getState().modal).toBe('project');
      expect(
        result.current.navItems.find(({ id }) => id === 'variables')?.isFlagged,
      ).toBe(true);
    });

    it('does NOT ask the vault when no variable changed', () => {
      const applied = vault();

      useAppStore.setState({ projects: [SHOP], editingProjectId: 'p1' });

      const { result } = renderHook(() => useProjectModalViewModel());

      act(() => {
        result.current.onConfirm();
      });

      expect(applied).toEqual([]);
      expect(useAppStore.getState().modal).toBeNull();
    });
  });
});
