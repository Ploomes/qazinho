import type { ISkillEditorProps } from '@/modules/Skills/components/SkillsSettings/components/SkillEditor/types';
import type { SkillUse } from '@/shared/types';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SKILL_EDITOR } from '@/modules/Skills/components/SkillsSettings/components/SkillEditor/constants';
import { SKILL_SAVE_KEYS, SKILL_USE_KEYS, SKILL_USES } from '@/modules/Skills/constants';
import { useSkillActions } from '@/modules/Skills/hooks';
import { Skills } from '@/services';

export const useSkillEditorViewModel = (props: ISkillEditorProps) => {
  const { editing, projects, onClose, onWithAgent } = props;
  const { skill, draft } = editing;
  const { t } = useTranslation();
  const { save, remove } = useSkillActions();
  const isOwn = skill === null || skill.source.kind === 'created';
  const [name, setName] = useState(skill?.name ?? draft?.name ?? '');
  const [description, setDescription] = useState(
    skill?.description ?? draft?.description ?? '',
  );
  const [body, setBody] = useState(skill?.body ?? draft?.body ?? '');
  const [use, setUse] = useState<SkillUse>(skill?.use ?? 'cases');
  const [projectIds, setProjectIds] = useState<string[] | null>(
    skill?.projectIds ?? null,
  );
  const [error, setError] = useState('');
  const [exported, setExported] = useState('');
  const files = skill?.files ?? draft?.files.map(({ name: file }) => file) ?? [];
  const source = skill?.source ?? { kind: 'created' as const };

  return {
    title: skill?.name ?? t('SKILLS.NEW_TITLE'),
    hasModes: skill === null && draft === null && onWithAgent !== undefined,
    modes: [
      { id: 'agent', label: t('SKILLS.WITH_AGENT') },
      { id: 'hand', label: t('SKILLS.BY_HAND') },
    ],
    onMode: (id: string) => {
      if (id === 'agent') onWithAgent?.();
    },
    width: SKILL_EDITOR.widthPx,
    isOwn,
    note:
      source.kind === 'repo'
        ? t('SKILLS.FROM_REPO_NOTE', { repository: source.repository })
        : source.kind === 'computer'
          ? t('SKILLS.FROM_COMPUTER_NOTE', { path: source.path })
          : '',
    nameLabel: t('SKILLS.NAME'),
    namePlaceholder: t('SKILLS.NAME_PLACEHOLDER'),
    name,
    descriptionLabel: t('SKILLS.DESCRIPTION'),
    descriptionPlaceholder: t('SKILLS.DESCRIPTION_PLACEHOLDER'),
    description,
    bodyLabel: t('SKILLS.BODY'),
    bodyPlaceholder: t('SKILLS.BODY_PLACEHOLDER'),
    body,
    useLabel: t('SKILLS.USE'),
    uses: SKILL_USES.map((id) => ({ id, label: t(SKILL_USE_KEYS[id]) })),
    use,
    projectsLabel: t('SKILLS.PROJECTS'),
    reaches: [
      { id: 'all', label: t('SKILLS.ALL_PROJECTS') },
      { id: 'some', label: t('SKILLS.SOME_PROJECTS') },
    ],
    reach: projectIds === null ? 'all' : 'some',
    isPicking: projectIds !== null,
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      isOn: projectIds?.includes(project.id) === true,
      onChange: (isOn: boolean) => {
        setProjectIds((kept) =>
          isOn
            ? [...(kept ?? []), project.id]
            : (kept ?? []).filter((id) => id !== project.id),
        );
      },
    })),
    filesLabel: files.length === 0 ? '' : t('SKILLS.FILES', { files: files.join(', ') }),
    error,
    exported,
    confirmLabel: t('SKILLS.SAVE'),
    canSave:
      !isOwn || (name.trim() !== '' && description.trim() !== '' && body.trim() !== ''),
    exportLabel: t('SKILLS.EXPORT'),
    canExport: skill !== null,
    deleteLabel: t('SKILLS.DELETE'),
    canDelete: skill !== null,
    duplicateLabel: t('SKILLS.DUPLICATE'),
    canDuplicate: !isOwn,
    onName: setName,
    onDescription: setDescription,
    onBody: (event: ChangeEvent<HTMLTextAreaElement>) => {
      setBody(event.target.value);
    },
    onUse: (id: string) => {
      const picked = SKILL_USES.find((one) => one === id);

      if (picked !== undefined) setUse(picked);
    },
    onReach: (id: string) => {
      setProjectIds(id === 'all' ? null : []);
    },
    onConfirm: async () => {
      const saved = await save({
        id: skill?.id ?? null,
        name,
        description,
        body,
        use,
        projectIds,
        isOn: skill?.isOn ?? true,
        draftId: draft?.draftId ?? null,
      });

      if (saved.isSaved) {
        onClose();

        return;
      }

      setError(t(SKILL_SAVE_KEYS[saved.reason]));
    },
    onCancel: () => {
      if (draft?.draftId) void Skills.dropDraft(draft.draftId);

      onClose();
    },
    onExport: async () => {
      if (skill === null) return;

      const path = await Skills.export(skill.id);

      if (path !== null) setExported(t('SKILLS.EXPORTED', { path }));
    },
    onDelete: async () => {
      if (skill === null) return;

      await remove(skill.id);
      onClose();
    },
    onDuplicate: async () => {
      const saved = await save({
        id: null,
        name: t('SKILLS.COPY_NAME', { name }),
        description,
        body,
        use,
        projectIds,
        isOn: false,
        draftId: null,
      });

      if (saved.isSaved) onClose();
      else setError(t(SKILL_SAVE_KEYS[saved.reason]));
    },
  };
};
