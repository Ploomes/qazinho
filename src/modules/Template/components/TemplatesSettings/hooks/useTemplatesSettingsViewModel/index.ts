import type { ITemplate, TemplateKind } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TEMPLATE_KIND_KEYS } from '@/modules/Template/components/TemplateEditor/constants';
import { useTemplateStore } from '@/store';

export const useTemplatesSettingsViewModel = () => {
  const { t } = useTranslation();
  const templates = useTemplateStore((state) => state.templates);
  const [editing, setEditing] = useState<ITemplate | 'new' | null>(null);

  return {
    note: t('TEMPLATES.NOTE'),
    newLabel: t('TEMPLATES.NEW'),
    noneText: t('TEMPLATES.NONE'),
    sections: (Object.keys(TEMPLATE_KIND_KEYS) as TemplateKind[]).map((kind) => ({
      kind,
      title: t(TEMPLATE_KIND_KEYS[kind]),
      rows: templates
        .filter((one) => one.kind === kind)
        .map((one) => ({
          id: one.id,
          name: one.name,
          facts: [
            one.parts.length === 1
              ? t('TEMPLATES.PARTS_ONE')
              : t('TEMPLATES.PARTS_OTHER', { count: one.parts.length }),
            ...(one.kind === 'plan' && one.cases === 'gherkin'
              ? [t('TEMPLATES.IN_GHERKIN')]
              : []),
          ].join(' · '),
          onOpen: () => {
            setEditing(one);
          },
        })),
    })),
    isEditing: editing !== null,
    editing: editing === 'new' ? null : editing,
    editorKey: editing === null || editing === 'new' ? 'new' : editing.id,
    onNew: () => {
      setEditing('new');
    },
    onClose: () => {
      setEditing(null);
    },
  };
};
