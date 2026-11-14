import type { ITemplateEditorProps } from '@/modules/Template/components/TemplateEditor/types';
import type { TemplateKind, TemplatePart } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TEMPLATE_EDITOR } from '@/modules/Template/components/TemplateEditor/constants';
import {
  ORG_TEMPLATE_FAILURE_KEYS,
  TEMPLATE_FIELDS,
  TEMPLATE_KIND_KEYS,
  TEMPLATE_VALUES,
} from '@/modules/Template/constants';
import { fillValues, renderParts } from '@/modules/Template/library';
import { Templates } from '@/services';
import { useProStore, useTemplateStore } from '@/store';

export const useTemplateEditorViewModel = (props: ITemplateEditorProps) => {
  const { editing, orgSlug, onClose } = props;
  const { t } = useTranslation();
  const landTemplate = useTemplateStore((state) => state.landTemplate);
  const dropTemplate = useTemplateStore((state) => state.dropTemplate);
  const setOrgTemplates = useTemplateStore((state) => state.setOrgTemplates);
  const orgTemplates = useTemplateStore((state) => state.orgTemplates);
  const status = useProStore((state) => state.status);
  const orgNameOf = (slug: string) =>
    (status?.isSignedIn === true
      ? status.orgs.find((one) => one.slug === slug)?.name
      : undefined) ?? slug;
  const wasDefault =
    editing !== null && 'isDefault' in editing && editing.isDefault === true;
  const labelOf = (kind: TemplateKind, field: string) => {
    const found = TEMPLATE_FIELDS[kind].find((one) => one.field === field);

    return found === undefined ? field : t(found.labelKey);
  };
  const defaultsOf = (kind: TemplateKind): TemplatePart[] =>
    TEMPLATE_FIELDS[kind].map(({ field }) => ({
      kind: 'section',
      field,
      heading: kind === 'bug' || kind === 'plan' ? labelOf(kind, field) : '',
    }));
  const [kind, setKind] = useState<TemplateKind>(editing?.kind ?? 'bug');
  const [name, setName] = useState(editing?.name ?? '');
  const [title, setTitle] = useState(editing?.title ?? '');
  const [cases, setCases] = useState(editing?.cases ?? 'steps');
  const [parts, setParts] = useState<TemplatePart[]>(
    () => editing?.parts ?? defaultsOf(editing?.kind ?? 'bug'),
  );
  const [failure, setFailure] = useState('');
  const [isSaving, setSaving] = useState(false);
  const [place, setPlace] = useState(orgSlug ?? 'mine');
  const [isDefault, setDefault] = useState(wasDefault);
  const org = orgTemplates.find((one) => one.orgSlug === place);
  const isOrg = place !== 'mine';
  const isReadOnly = editing !== null && isOrg && org?.canPublish !== true;
  const places = [
    { id: 'mine', label: t('TEMPLATES.WHERE_MINE') },
    ...orgTemplates
      .filter(({ canPublish }) => canPublish)
      .map((one) => ({ id: one.orgSlug, label: orgNameOf(one.orgSlug) })),
  ];
  const refreshOrg = async (slug: string) => {
    const read = await Templates.listOrg(slug);

    if (read.isListed) setOrgTemplates(read.list);
  };
  const draft = { kind, name, title, parts, cases };
  const saveOrg = async (slug: string) => {
    const saved = await Templates.saveOrg({
      orgSlug: slug,
      template: { ...draft, id: editing?.id ?? null },
    });

    if (!saved.isSaved) return t(ORG_TEMPLATE_FAILURE_KEYS[saved.failure]);

    if (org?.canSetDefault === true && isDefault !== wasDefault) {
      const chosen = await Templates.setOrgDefault({
        orgSlug: slug,
        kind,
        id: isDefault ? saved.template.id : null,
      });

      if (!chosen.isDone) return t(ORG_TEMPLATE_FAILURE_KEYS[chosen.failure]);
    }

    await refreshOrg(slug);

    return null;
  };
  const saveMine = async () => {
    const saved = await Templates.save({
      ...draft,
      id: isReadOnly ? null : (editing?.id ?? null),
    });

    if (!saved.isSaved)
      return saved.reason === 'unnamed'
        ? t('TEMPLATES.UNNAMED')
        : t('TEMPLATES.UNWRITABLE');

    landTemplate(saved.template);

    return null;
  };

  const used = new Set(
    parts.flatMap((part) => (part.kind === 'section' ? [part.field] : [])),
  );
  const fieldsNote = TEMPLATE_VALUES[kind].map((value) => `{{${value}}}`).join(', ');
  const marked = Object.fromEntries(
    TEMPLATE_VALUES[kind].map((value) => [value, `‹${value}›`]),
  );
  const change = (index: number, part: TemplatePart) => {
    setParts(parts.map((one, at) => (at === index ? part : one)));
  };

  return {
    title: editing === null ? t('TEMPLATES.NEW_TITLE') : t('TEMPLATES.EDIT_TITLE'),
    width: TEMPLATE_EDITOR.width,
    isNew: editing === null,
    hasPlaces: editing === null && places.length > 1,
    placeLabel: t('TEMPLATES.WHERE'),
    places,
    place,
    onPlace: (id: string) => {
      setPlace(id);
      setDefault(false);
    },
    hasDefault: isOrg && org?.canSetDefault === true,
    defaultLabel: t('TEMPLATES.IS_DEFAULT'),
    isDefault,
    onDefault: setDefault,
    kindLabel: t('TEMPLATES.KIND'),
    kind,
    kinds: (Object.keys(TEMPLATE_KIND_KEYS) as TemplateKind[]).map((id) => ({
      id,
      label: t(TEMPLATE_KIND_KEYS[id]),
    })),
    nameLabel: t('TEMPLATES.NAME'),
    namePlaceholder: t('TEMPLATES.NAME_PLACEHOLDER'),
    name,
    hasTitle: kind === 'bug',
    titleLabel: t('TEMPLATES.TITLE'),
    titleValue: title,
    titleNote: t('TEMPLATES.TITLE_NOTE', { fields: fieldsNote }),
    hasCases: kind === 'plan',
    casesLabel: t('TEMPLATES.CASES'),
    cases,
    casesOptions: [
      { id: 'steps', label: t('TEMPLATES.CASES_STEPS') },
      { id: 'gherkin', label: t('TEMPLATES.CASES_GHERKIN') },
    ],
    partsLabel: t('TEMPLATES.PARTS'),
    textNote: t('TEMPLATES.TEXT_NOTE', { fields: fieldsNote }),
    moveUpLabel: t('TEMPLATES.MOVE_UP'),
    moveDownLabel: t('TEMPLATES.MOVE_DOWN'),
    removeLabel: t('TEMPLATES.REMOVE'),
    parts: parts.map((part, index) => ({
      key: `${part.kind}-${part.kind === 'section' ? part.field : String(index)}`,
      index,
      isSection: part.kind === 'section',
      label:
        part.kind === 'section'
          ? t('TEMPLATES.HEADING', { field: labelOf(kind, part.field) })
          : t('TEMPLATES.TEXT'),
      value: part.kind === 'section' ? part.heading : part.text,
      canUp: index > 0,
      canDown: index < parts.length - 1,
    })),
    addable: TEMPLATE_FIELDS[kind]
      .filter(({ field }) => !used.has(field))
      .map(({ field }) => ({
        field,
        label: t('TEMPLATES.ADD_SECTION', { field: labelOf(kind, field) }),
      })),
    addTextLabel: t('TEMPLATES.ADD_TEXT'),
    previewLabel: t('TEMPLATES.PREVIEW'),
    previewTitle: kind === 'bug' ? fillValues({ text: title, values: marked }) : '',
    preview: renderParts({
      parts,
      sections: Object.fromEntries(
        TEMPLATE_FIELDS[kind].map(({ field }) => [
          field,
          [{ kind: 'paragraph', text: `‹${labelOf(kind, field)}›` }],
        ]),
      ),
      values: marked,
    }),
    confirmLabel: isReadOnly ? t('TEMPLATES.COPY') : t('TEMPLATES.SAVE'),
    canConfirm: !isSaving && name.trim() !== '',
    hint: failure !== '' ? failure : isReadOnly ? t('TEMPLATES.READ_ONLY') : undefined,
    canDelete: editing !== null && !isReadOnly,
    deleteLabel: t('TEMPLATES.DELETE'),
    onKind: (id: string) => {
      if (editing !== null) return;

      const next = id as TemplateKind;

      setKind(next);
      setParts(defaultsOf(next));
    },
    onName: setName,
    onTitle: setTitle,
    onCases: (id: string) => {
      setCases(id === 'gherkin' ? 'gherkin' : 'steps');
    },
    onValue: (typed: { index: number; value: string }) => {
      const part = parts[typed.index];

      if (part === undefined) return;

      change(
        typed.index,
        part.kind === 'section'
          ? { ...part, heading: typed.value }
          : { ...part, text: typed.value },
      );
    },
    onMove: (moved: { index: number; by: -1 | 1 }) => {
      const to = moved.index + moved.by;
      const part = parts[moved.index];
      const other = parts[to];

      if (part === undefined || other === undefined) return;

      setParts(
        parts.map((one, at) => (at === moved.index ? other : at === to ? part : one)),
      );
    },
    onRemove: (index: number) => {
      setParts(parts.filter((_, at) => at !== index));
    },
    onAddSection: (field: string) => {
      setParts([
        ...parts,
        {
          kind: 'section',
          field,
          heading: kind === 'bug' || kind === 'plan' ? labelOf(kind, field) : '',
        },
      ]);
    },
    onAddText: () => {
      setParts([...parts, { kind: 'text', text: '' }]);
    },
    onCancel: onClose,
    onConfirm: () => {
      if (isSaving || name.trim() === '') return;

      setSaving(true);
      setFailure('');
      void (isOrg && !isReadOnly ? saveOrg(place) : saveMine()).then((refused) => {
        setSaving(false);

        if (refused !== null) {
          setFailure(refused);

          return;
        }

        onClose();
      });
    },
    onDelete: () => {
      if (editing === null) return;

      if (isOrg) {
        void Templates.removeOrg({ orgSlug: place, id: editing.id }).then(
          async (done) => {
            if (!done.isDone) {
              setFailure(t(ORG_TEMPLATE_FAILURE_KEYS[done.failure]));

              return;
            }

            await refreshOrg(place);
            onClose();
          },
        );

        return;
      }

      void Templates.remove(editing.id).then((isRemoved) => {
        if (!isRemoved) {
          setFailure(t('TEMPLATES.UNWRITABLE'));

          return;
        }

        dropTemplate(editing.id);
        onClose();
      });
    },
  };
};
