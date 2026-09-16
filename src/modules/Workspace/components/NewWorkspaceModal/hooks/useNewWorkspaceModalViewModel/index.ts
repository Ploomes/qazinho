import { useState } from 'react';
import { toPlanKind } from '@/modules/Plan/library';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useNewWorkspaceModalViewModel = () => {
  const [name, setName] = useState('');
  const [targetId, setTargetId] = useState<string | null>(null);

  const projects = useAppStore((state) => state.projects);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const closeModal = useAppStore((state) => state.closeModal);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const addWorkspace = useWorkspaceStore((state) => state.addWorkspace);

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
      status: 'idle',
      issue: null,
      chat: [],
      plan: [],
      runs: [],
      bugs: [],
      live: null,
      hasBeenAsked: false,
    });

    selectWorkspace(id);
    closeModal();
  };

  return {
    name,
    targets,
    chosenTargetId: chosen?.id ?? null,
    projectName: project?.name ?? '',
    canCreate: name.trim().length > 0 && chosen !== null,
    onNameChange: setName,
    onTargetChange: setTargetId,
    onCancel: closeModal,
    onCreate,
  };
};
