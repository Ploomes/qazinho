import type { ITargetLock } from '@/modules/Project/components/ProjectModal/components/TargetCard/types';
import type { IProjectRepository, ITarget } from '@/modules/Project/types';
import type { BuildPlatform, TargetKind } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TARGET_NAME_KEYS } from '@/modules/Project/components/ProjectModal/constants';
import { newProjectId, webAddressOf } from '@/modules/Project/library';
import { SETUP_LINKS } from '@/modules/Setup/constants';
import { Agent, Archive, Files, Platform, Run } from '@/services';
import {
  useAppStore,
  useBuildStore,
  useMachineStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

export const useProjectModalViewModel = () => {
  const { t } = useTranslation();
  const projects = useAppStore((state) => state.projects);
  const editingProjectId = useAppStore((state) => state.editingProjectId);
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const addProject = useAppStore((state) => state.addProject);
  const updateProject = useAppStore((state) => state.updateProject);
  const removeProject = useAppStore((state) => state.removeProject);
  const closeModal = useAppStore((state) => state.closeModal);
  const tools = useMachineStore((state) => state.tools);
  const isGithubConnected = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'github'),
  );
  const builds = useBuildStore((state) => state.builds);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const removeWorkspacesOf = useWorkspaceStore((state) => state.removeWorkspacesOf);

  const [editing] = useState(
    () => projects.find(({ id }) => id === editingProjectId) ?? null,
  );
  const saved = (kind: TargetKind) =>
    editing?.targets.find((target) => target.kind === kind) ?? null;

  const [name, setName] = useState(editing?.name ?? '');
  const [url, setUrl] = useState(saved('web')?.value ?? '');
  const [apk, setApk] = useState(saved('android')?.value ?? '');
  const [app, setApp] = useState(saved('ios')?.value ?? '');
  const [repositories, setRepositories] = useState<IProjectRepository[]>(
    editing?.repositories ?? [],
  );
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);
  const [buildIds, setBuildIds] = useState<Record<BuildPlatform, string | null>>({
    android: null,
    ios: null,
  });

  const buildOf = (platform: BuildPlatform) => {
    const ongoing =
      editing === null
        ? undefined
        : builds.find(
            (build) =>
              build.projectId === editing.id &&
              build.platform === platform &&
              build.phase === 'working',
          );
    const buildId = buildIds[platform] ?? ongoing?.id ?? null;
    const result = builds.find(({ id }) => id === buildId)?.result ?? null;

    return { buildId, artifact: result?.isBuilt === true ? result.artifact : null };
  };
  const androidBuild = buildOf('android');
  const iosBuild = buildOf('ios');
  const apkValue = androidBuild.artifact ?? apk;
  const appValue = iosBuild.artifact ?? app;

  const isMac = Platform.isMac();
  const isEditing = editing !== null;
  const own = workspaces.filter((workspace) => workspace.projectId === editing?.id);
  const address = webAddressOf(url);
  const values: Record<TargetKind, string> = {
    web: address ?? url.trim(),
    android: apkValue.trim(),
    ios: appValue.trim(),
  };
  const hasTarget = Object.values(values).some((value) => value.length > 0);

  const orphaned =
    editing?.targets.find(
      (target) =>
        values[target.kind].length === 0 &&
        own.some((workspace) => workspace.targetId === target.id),
    ) ?? null;

  const blocking =
    name.trim().length === 0
      ? isEditing
        ? t('PROJECT.NEEDS_NAME_EDIT')
        : t('PROJECT.NEEDS_NAME')
      : url.trim().length > 0 && address === null
        ? t('PROJECT.WEB_INVALID')
        : !hasTarget
          ? isEditing
            ? t('PROJECT.NEEDS_TARGET_EDIT')
            : t('PROJECT.NEEDS_TARGET')
          : orphaned === null
            ? undefined
            : t('PROJECT.TARGET_IN_USE', { target: t(TARGET_NAME_KEYS[orphaned.kind]) });

  const targetFor = (kind: TargetKind): ITarget[] => {
    const value = values[kind];

    if (value.length === 0) return [];

    const kept = saved(kind);
    const label = t(TARGET_NAME_KEYS[kind]);

    return [
      kept === null ? { id: `t-${kind}`, kind, label, value } : { ...kept, label, value },
    ];
  };

  const onConfirm = () => {
    if (blocking !== undefined) return;

    const targets = [...targetFor('web'), ...targetFor('android'), ...targetFor('ios')];

    if (editing) updateProject({ ...editing, name: name.trim(), targets, repositories });
    else addProject({ id: newProjectId(), name: name.trim(), targets, repositories });
  };

  const onDelete = () => {
    if (!editing) return;

    for (const workspace of own) {
      Run.stop(workspace.id);
      void Agent.stop(workspace.id);
      Archive.removeWorkspace(workspace.id);
    }

    removeWorkspacesOf(editing.id);
    removeProject({
      projectId: editing.id,
      isOpen: own.some((workspace) => workspace.id === selectedWorkspaceId),
    });
  };

  const builderOf = (props: { platform: BuildPlatform; buildId: string | null }) => ({
    isShown: isGithubConnected && repositories.length > 0,
    buildId: props.buildId,
    onStart: (buildId: string) => {
      setBuildIds((ids) => ({ ...ids, [props.platform]: buildId }));
    },
    onReset: () => {
      setBuildIds((ids) => ({ ...ids, [props.platform]: null }));
    },
  });

  return {
    name,
    url,
    apk: apkValue,
    app: appValue,
    repositories,
    projectId: editing?.id ?? null,
    androidBuilder: builderOf({ platform: 'android', buildId: androidBuild.buildId }),
    iosBuilder: builderOf({ platform: 'ios', buildId: iosBuild.buildId }),
    isMac,
    isEditing,
    isConfirmingDelete,
    title: isEditing ? t('PROJECT.EDIT_TITLE') : t('PROJECT.NEW_TITLE'),
    subtitle: isEditing
      ? t('PROJECT.EDIT_SUBTITLE', { name: editing.name })
      : t('PROJECT.NEW_SUBTITLE'),
    confirmLabel: isEditing ? t('PROJECT.SAVE') : t('PROJECT.CREATE'),
    canConfirm: blocking === undefined,
    deleteQuestion:
      own.length === 0
        ? t('PROJECT.DELETE_QUESTION_EMPTY')
        : own.length === 1
          ? t('PROJECT.DELETE_QUESTION_ONE')
          : t('PROJECT.DELETE_QUESTION_OTHER', { count: own.length }),
    androidLock:
      tools.androidSdk.isFound || apkValue.length > 0
        ? null
        : ({
            reason: t('PROJECT.ANDROID_LOCKED'),
            setUp: {
              label: t('PROJECT.ANDROID_SET_UP'),
              guide: t('PROJECT.ANDROID_GUIDE'),
              link: { label: t('PROJECT.ANDROID_LINK'), url: SETUP_LINKS.androidStudio },
            },
          } satisfies ITargetLock),
    iosLock: !isMac
      ? ({ reason: t('PROJECT.IOS_LOCKED_MAC'), setUp: null } satisfies ITargetLock)
      : tools.xcode.isFound || appValue.length > 0
        ? null
        : ({
            reason: t('PROJECT.IOS_LOCKED'),
            setUp: {
              label: t('PROJECT.IOS_SET_UP'),
              guide: t('PROJECT.IOS_GUIDE'),
              link: { label: t('PROJECT.IOS_LINK'), url: SETUP_LINKS.xcode },
            },
          } satisfies ITargetLock),
    footerHint: blocking,
    onNameChange: setName,
    onRepositoriesChange: setRepositories,
    onUrlChange: setUrl,
    onPickApk: () => {
      void Files.pick('apk').then((picked) => {
        if (picked === null) return;

        setBuildIds((ids) => ({ ...ids, android: null }));
        setApk(picked);
      });
    },
    onPickApp: () => {
      void Files.pick('app').then((picked) => {
        if (picked === null) return;

        setBuildIds((ids) => ({ ...ids, ios: null }));
        setApp(picked);
      });
    },
    onCancel: closeModal,
    onConfirm,
    onAskDelete: () => {
      setConfirmingDelete(true);
    },
    onKeep: () => {
      setConfirmingDelete(false);
    },
    onDelete,
  };
};
