import type { ITarget } from '@/modules/Project/types';
import type { TargetKind } from '@/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { newProjectId } from '@/modules/Project/library';
import { Archive, Files, Platform, Run } from '@/services';
import { useAppStore, useMachineStore, useWorkspaceStore } from '@/store';

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
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);

  const isMac = Platform.isMac();
  const isEditing = editing !== null;
  const own = workspaces.filter((workspace) => workspace.projectId === editing?.id);
  const values: Record<TargetKind, string> = {
    web: url.trim(),
    android: apk.trim(),
    ios: app.trim(),
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
      : !hasTarget
        ? isEditing
          ? t('PROJECT.NEEDS_TARGET_EDIT')
          : t('PROJECT.NEEDS_TARGET')
        : orphaned === null
          ? undefined
          : t('PROJECT.TARGET_IN_USE', { target: orphaned.label });

  const targetFor = (props: { kind: TargetKind; label: string }): ITarget[] => {
    const value = values[props.kind];

    if (value.length === 0) return [];

    const kept = saved(props.kind);

    return [
      kept === null
        ? { id: `t-${props.kind}`, kind: props.kind, label: props.label, value }
        : { ...kept, value },
    ];
  };

  const onConfirm = () => {
    if (blocking !== undefined) return;

    const targets = [
      ...targetFor({ kind: 'web', label: 'Web' }),
      ...targetFor({ kind: 'android', label: 'Android · Pixel 7' }),
      ...targetFor({ kind: 'ios', label: 'iOS · iPhone 16' }),
    ];

    if (editing) updateProject({ ...editing, name: name.trim(), targets });
    else addProject({ id: newProjectId(), name: name.trim(), targets });
  };

  const onDelete = () => {
    if (!editing) return;

    for (const workspace of own) {
      if (workspace.live && !workspace.live.isDone) Run.stop(workspace.id);

      Archive.removeWorkspace(workspace.id);
    }

    removeWorkspacesOf(editing.id);
    removeProject({
      projectId: editing.id,
      isOpen: own.some((workspace) => workspace.id === selectedWorkspaceId),
    });
  };

  return {
    name,
    url,
    apk,
    app,
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
    androidNote: tools.androidSdk.isFound
      ? t('TOOLS.ANDROID_FOUND')
      : t('TOOLS.ANDROID_MISSING'),
    xcodeNote: isMac
      ? tools.xcode.isFound
        ? t('TOOLS.XCODE_FOUND')
        : t('TOOLS.XCODE_MISSING')
      : t('PROJECT.IOS_MAC_ONLY'),
    isIosAvailable: isMac && tools.xcode.isFound,
    footerHint: blocking,
    onNameChange: setName,
    onUrlChange: setUrl,
    onPickApk: () => {
      void Files.pick('apk').then((picked) => {
        if (picked !== null) setApk(picked);
      });
    },
    onPickApp: () => {
      void Files.pick('app').then((picked) => {
        if (picked !== null) setApp(picked);
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
