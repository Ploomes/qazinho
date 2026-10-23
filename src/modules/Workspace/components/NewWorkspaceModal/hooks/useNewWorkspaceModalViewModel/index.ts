import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toPlanKind } from '@/modules/Plan';
import { PLATFORM_LABEL } from '@/modules/Workspace/constants';
import { useAppStore, useSettingsStore, useSetupStore, useWorkspaceStore } from '@/store';

export const useNewWorkspaceModalViewModel = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [targetId, setTargetId] = useState<string | null>(null);

  const projects = useAppStore((state) => state.projects);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const closeModal = useAppStore((state) => state.closeModal);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const addWorkspace = useWorkspaceStore((state) => state.addWorkspace);
  const openSettings = useAppStore((state) => state.openSettings);
  const selectSettingsTab = useSettingsStore((state) => state.selectTab);
  const isJiraConnected = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'jira'),
  );

  const project =
    projects.find(({ id }) => id === selectedProjectId) ?? projects[0] ?? null;
  const targets = project?.targets ?? [];
  const chosen = targets.find(({ id }) => id === targetId) ?? targets[0] ?? null;

  const onCreate = () => {
    if (name.trim().length === 0 || project === null || chosen === null) return;

    const id = `w-${String(Date.now())}`;

    addWorkspace({
      id,
      projectId: project.id,
      name: name.trim(),
      targetId: chosen.id,
      planKind: toPlanKind(chosen.kind),
      sessionId: null,
      sessionAgentId: null,
      status: 'idle',
      issue: null,
      design: null,
      chat: [],
      plan: [],
      runs: [],
      bugs: [],
      live: null,
      hasBeenAsked: false,
      planSource: null,
      sourcePage: null,
      unreadPlan: null,
      plainValues: [],
      published: null,
      viewportId: 'desktop',
      context: null,
    });

    selectWorkspace(id);
    closeModal();
  };

  const blocking =
    chosen === null
      ? t('NEW_WORKSPACE.NEEDS_TARGET')
      : name.trim().length === 0
        ? t('NEW_WORKSPACE.NEEDS_NAME')
        : undefined;

  return {
    name,
    targets,
    platforms: targets.map((target) => ({
      id: target.id,
      kind: target.kind,
      label: t(PLATFORM_LABEL[target.kind]),
      isChosen: target.id === chosen?.id,
    })),
    footerHint: blocking,
    chosenTargetId: chosen?.id ?? null,
    projectName: project?.name ?? '',
    canCreate: name.trim().length > 0 && chosen !== null,
    issueText: t(
      isJiraConnected ? 'NEW_WORKSPACE.ISSUE_READY' : 'NEW_WORKSPACE.ISSUE_EMPTY',
    ),
    canConnect: !isJiraConnected,
    connectLabel: t('NEW_WORKSPACE.ISSUE_CONNECT'),
    onConnect: () => {
      selectSettingsTab('integrations');
      closeModal();
      openSettings();
    },
    onNameChange: setName,
    onTargetChange: setTargetId,
    onCancel: closeModal,
    onCreate,
  };
};
