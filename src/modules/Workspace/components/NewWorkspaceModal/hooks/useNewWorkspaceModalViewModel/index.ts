import type { IImportSource } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toPlanKind } from '@/modules/Plan';
import { PLATFORM_LABEL } from '@/modules/Workspace/constants';
import { useAppStore, useSetupStore, useWorkspaceStore } from '@/store';

export const useNewWorkspaceModalViewModel = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [folder, setFolder] = useState<IImportSource | null>(null);
  const [isStory, setStory] = useState(false);

  const projects = useAppStore((state) => state.projects);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const closeModal = useAppStore((state) => state.closeModal);
  const requestImport = useAppStore((state) => state.requestImport);
  const requestCommand = useAppStore((state) => state.requestCommand);
  const hasJira = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'jira'),
  );
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const addWorkspace = useWorkspaceStore((state) => state.addWorkspace);

  const project =
    projects.find(({ id }) => id === selectedProjectId) ?? projects[0] ?? null;
  const targets = project?.targets ?? [];
  const chosen = targets.find(({ id }) => id === targetId) ?? targets[0] ?? null;

  const onCreate = () => {
    if (project === null || chosen === null) return;

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
    if (folder !== null) requestImport({ workspaceId: id, source: folder });
    else if (isStory && hasJira)
      requestCommand({ workspaceId: id, command: 'jira-plan' });
    closeModal();
  };

  return {
    name,
    folder,
    canStory: hasJira && folder === null,
    isStory,
    canImport: !isStory,
    storyLabel: t('NEW_WORKSPACE.FROM_STORY'),
    storyOnLabel: t('NEW_WORKSPACE.FROM_STORY_ON'),
    storyRemoveLabel: t('NEW_WORKSPACE.FROM_STORY_REMOVE'),
    onStory: () => {
      setStory(!isStory);
    },
    onFolderChange: (picked: IImportSource | null) => {
      setFolder(picked);
      if (picked !== null && name.trim().length === 0) setName(picked.name);
    },
    targets,
    hasPlatforms: targets.length > 1,
    platforms: targets.map((target) => ({
      id: target.id,
      kind: target.kind,
      label: t(PLATFORM_LABEL[target.kind]),
      isChosen: target.id === chosen?.id,
      className:
        target.id === chosen?.id
          ? 'new-workspace__platform new-workspace__platform--chosen'
          : 'new-workspace__platform',
      onClick: () => {
        setTargetId(target.id);
      },
    })),
    footerHint: chosen === null ? t('NEW_WORKSPACE.NEEDS_TARGET') : undefined,
    chosenTargetId: chosen?.id ?? null,
    canCreate: chosen !== null,
    onNameChange: setName,
    onCancel: closeModal,
    onCreate,
  };
};
