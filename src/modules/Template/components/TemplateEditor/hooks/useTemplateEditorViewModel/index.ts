import type { ITemplateEditorProps } from '@/modules/Template/components/TemplateEditor/types';
import type { TemplateKind, TemplatePart } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TEMPLATE_EDITOR } from '@/modules/Template/components/TemplateEditor/constants';
import {
  TEMPLATE_FIELDS,
  TEMPLATE_KIND_KEYS,
  TEMPLATE_VALUES,
} from '@/modules/Template/constants';
import { fillValues, renderParts } from '@/modules/Template/library';
import { Templates } from '@/services';
import { useTemplateStore } from '@/store';

export const useTemplateEditorViewModel = (props: ITemplateEditorProps) => {
  const { editing, onClose } = props;
  const { t } = useTranslation();
  const landTemplate = useTemplateStore((state) => state.landTemplate);
  const dropTemplate = useTemplateStore((state) => state.dropTemplate);
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
    confirmLabel: t('TEMPLATES.SAVE'),
    canConfirm: !isSaving && name.trim() !== '',
    hint: failure === '' ? undefined : failure,
    canDelete: editing !== null,
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
      void Templates.save({
        id: editing?.id ?? null,
        kind,
        name,
        title,
        parts,
        cases,
      }).then((saved) => {
        setSaving(false);

        if (!saved.isSaved) {
          setFailure(
            saved.reason === 'unnamed'
              ? t('TEMPLATES.UNNAMED')
              : t('TEMPLATES.UNWRITABLE'),
          );

          return;
        }

        landTemplate(saved.template);
        onClose();
      });
    },
    onDelete: () => {
      if (editing === null) return;

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
