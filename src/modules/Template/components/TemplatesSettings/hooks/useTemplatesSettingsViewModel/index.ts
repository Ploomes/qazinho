import type { ITemplate, TemplateKind } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TEMPLATE_KIND_KEYS } from '@/modules/Template/constants';
import { useProStore, useTemplateStore } from '@/store';

export const useTemplatesSettingsViewModel = () => {
  const { t } = useTranslation();
  const templates = useTemplateStore((state) => state.templates);
  const orgTemplates = useTemplateStore((state) => state.orgTemplates);
  const status = useProStore((state) => state.status);
  const [editing, setEditing] = useState<
    { template: ITemplate; orgSlug: string | null } | 'new' | null
  >(null);
  const orgNameOf = (slug: string) =>
    (status?.isSignedIn === true
      ? status.orgs.find((one) => one.slug === slug)?.name
      : undefined) ?? slug;
  const factsOf = (template: ITemplate) => [
    template.parts.length === 1
      ? t('TEMPLATES.PARTS_ONE')
      : t('TEMPLATES.PARTS_OTHER', { count: template.parts.length }),
    ...(template.kind === 'plan' && template.cases === 'gherkin'
      ? [t('TEMPLATES.IN_GHERKIN')]
      : []),
  ];
  const all = [
    ...templates.map((template) => ({
      template,
      orgSlug: null,
      facts: factsOf(template),
    })),
    ...orgTemplates.flatMap((org) =>
      org.templates.map((template) => ({
        template,
        orgSlug: org.orgSlug,
        facts: [
          orgNameOf(org.orgSlug),
          ...(template.isDefault ? [t('TEMPLATES.ORG_DEFAULT')] : []),
          ...factsOf(template),
        ],
      })),
    ),
  ];

  return {
    note: t('TEMPLATES.NOTE'),
    newLabel: t('TEMPLATES.NEW'),
    noneText: t('TEMPLATES.NONE'),
    sections: (Object.keys(TEMPLATE_KIND_KEYS) as TemplateKind[]).map((kind) => ({
      kind,
      title: t(TEMPLATE_KIND_KEYS[kind]),
      rows: all
        .filter(({ template }) => template.kind === kind)
        .map(({ template, orgSlug, facts }) => ({
          id: template.id,
          name: template.name,
          facts: facts.join(' · '),
          onOpen: () => {
            setEditing({ template, orgSlug });
          },
        })),
    })),
    isEditing: editing !== null,
    editing: editing === null || editing === 'new' ? null : editing.template,
    editingOrg: editing === null || editing === 'new' ? null : editing.orgSlug,
    editorKey: editing === null || editing === 'new' ? 'new' : editing.template.id,
    onNew: () => {
      setEditing('new');
    },
    onClose: () => {
      setEditing(null);
    },
  };
};
