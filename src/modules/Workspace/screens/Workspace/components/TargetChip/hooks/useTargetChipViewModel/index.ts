import type { ITargetOption } from '@/modules/Workspace/screens/Workspace/components/TargetChip/types';
import type { TargetKind } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { withBuiltTarget } from '@/modules/Build';
import { toPlanKind } from '@/modules/Plan';
import { PLATFORM_LABEL } from '@/modules/Workspace/constants';
import { Files } from '@/services';
import { useDismiss } from '@/shared/hooks';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useTargetChipViewModel = () => {
  const { t } = useTranslation();
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const projects = useAppStore((state) => state.projects);
  const updateProject = useAppStore((state) => state.updateProject);
  const openProjectSettings = useAppStore((state) => state.openProjectSettings);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const setTarget = useWorkspaceStore((state) => state.setTarget);
  const [isOpen, setOpen] = useState(false);
  const popoverRef = useDismiss<HTMLDivElement>(() => {
    setOpen(false);
  });

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const project =
    workspace === null
      ? null
      : (projects.find(({ id }) => id === workspace.projectId) ?? null);

  if (workspace === null || project === null) return { hasWorkspace: false as const };

  const workspaceId = workspace.id;
  const buildOf = (kind: TargetKind, value: string): string =>
    kind === 'web'
      ? value.replace(/^https?:\/\//, '').replace(/\/$/, '') || value
      : (value.split(/[\\/]/).pop() ?? value);

  const choose = (kind: TargetKind) => {
    if (kind === 'web') {
      openProjectSettings(project.id);
      setOpen(false);
      return;
    }

    void Files.pick(kind === 'ios' ? 'app' : 'apk').then((picked) => {
      if (picked === null) return;

      const label = t(PLATFORM_LABEL[kind]);
      updateProject(
        withBuiltTarget({ project, platform: kind, artifact: picked, label }),
      );
      setTarget({ workspaceId, targetId: `t-${kind}`, planKind: toPlanKind(kind) });
      setOpen(false);
    });
  };

  const options: ITargetOption[] = (['ios', 'android', 'web'] as const).map((kind) => {
    const target = project.targets.find((one) => one.kind === kind) ?? null;
    const hasValue = target !== null && target.value.trim().length > 0;

    return {
      kind,
      kindLabel: t(PLATFORM_LABEL[kind]),
      value: hasValue ? buildOf(kind, target.value) : '',
      hasValue,
      isActive: target !== null && target.id === workspace.targetId,
      chooseLabel: t(`WORKSPACE.TARGET_PICK_${kind.toUpperCase()}` as never),
      onSelect: () => {
        if (!hasValue || target === null) return;

        setTarget({ workspaceId, targetId: target.id, planKind: toPlanKind(kind) });
        setOpen(false);
      },
      onChoose: () => {
        choose(kind);
      },
    };
  });

  const current = project.targets.find(({ id }) => id === workspace.targetId) ?? null;
  const owned = workspaces.filter(({ projectId }) => projectId === project.id).length;

  return {
    hasWorkspace: true as const,
    isOpen,
    popoverRef,
    hasTarget: current !== null,
    current:
      current === null
        ? null
        : {
            kind: current.kind,
            kindLabel: t(PLATFORM_LABEL[current.kind]),
            build: buildOf(current.kind, current.value),
          },
    pickLabel: t('WORKSPACE.TARGET_PICK'),
    title: t('WORKSPACE.TARGETS_OF', { project: project.name }),
    sharedLabel:
      owned === 1
        ? t('WORKSPACE.TARGETS_SHARED_ONE')
        : t('WORKSPACE.TARGETS_SHARED_OTHER', { count: owned }),
    options,
    noneLabel: t('WORKSPACE.TARGET_NONE'),
    moreLabel: t('WORKSPACE.TARGETS_MORE'),
    onToggle: () => {
      setOpen((open) => !open);
    },
    onClose: () => {
      setOpen(false);
    },
    onMore: () => {
      openProjectSettings(project.id);
      setOpen(false);
    },
  };
};
