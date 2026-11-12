import type { ISkillEditing } from '@/modules/Skills/components/SkillsSettings/types';
import type { ISkill } from '@/shared/types';
import { useEffect, useEffectEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSkillActions } from '@/modules/Skills/hooks';
import { saveOfSkill, skillFactsOf } from '@/modules/Skills/library';
import { useAppStore, useSkillStore } from '@/store';

export const useSkillsSettingsViewModel = () => {
  const { t } = useTranslation();
  const skills = useSkillStore((state) => state.skills);
  const isLoaded = useSkillStore((state) => state.isLoaded);
  const projects = useAppStore((state) => state.projects);
  const { load, refresh, save } = useSkillActions();
  const [editing, setEditing] = useState<ISkillEditing | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const open = useEffectEvent(() => {
    void load().then(refresh);
  });

  useEffect(() => {
    open();
  }, []);

  const rowOf = (skill: ISkill) => {
    const { facts, source } = skillFactsOf({ skill, projects, t });

    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      facts,
      source,
      isOn: skill.isOn,
      toggleLabel: t('SKILLS.TOGGLE', { name: skill.name }),
      editLabel: t('SKILLS.EDIT', { name: skill.name }),
      onToggle: (isOn: boolean) => {
        void save(saveOfSkill({ skill, change: { isOn } }));
      },
      onOpen: () => {
        setEditing({ skill, draft: null });
      },
    };
  };
  const sorted = [...skills].sort((one, other) => one.name.localeCompare(other.name));

  return {
    note: t('SKILLS.NOTE'),
    newLabel: t('SKILLS.NEW'),
    importLabel: t('SKILLS.IMPORT'),
    isEmpty: isLoaded && skills.length === 0,
    emptyTitle: t('SKILLS.EMPTY_TITLE'),
    emptyText: t('SKILLS.EMPTY_TEXT'),
    sections: [
      { key: 'on', title: t('SKILLS.ON'), rows: sorted.filter(({ isOn }) => isOn) },
      { key: 'off', title: t('SKILLS.OFF'), rows: sorted.filter(({ isOn }) => !isOn) },
    ]
      .filter(({ rows }) => rows.length > 0)
      .map((section) => ({ ...section, rows: section.rows.map(rowOf) })),
    projects,
    editing,
    isCreating,
    isImporting,
    onNew: () => {
      setIsCreating(true);
    },
    onImport: () => {
      setIsImporting(true);
    },
    onCloseEditor: () => {
      setEditing(null);
    },
    onCloseCreator: () => {
      setIsCreating(false);
    },
    onCloseImport: () => {
      setIsImporting(false);
    },
    onWrite: () => {
      setIsCreating(false);
      setEditing({ skill: null, draft: null });
    },
    onDrafted: (draft: NonNullable<ISkillEditing['draft']>) => {
      setIsCreating(false);
      setEditing({ skill: null, draft });
    },
  };
};
