import type { IOrgTemplates, ITemplate, TemplateKind } from '@/shared/types';

/**
 * O modelo que vale para um projeto: o que o QA escolheu nele, senão o padrão da org do
 * projeto, senão nenhum, e o QAzinho monta do jeito dele.
 */
export function templateFor(props: {
  kind: TemplateKind;
  chosen: Partial<Record<TemplateKind, string>> | undefined;
  templates: ITemplate[];
  org: IOrgTemplates | undefined;
}): ITemplate | null {
  const { kind, org } = props;
  const picked = props.chosen?.[kind];
  const all = [...props.templates, ...(org?.templates ?? [])];
  const find = (id: string | undefined) =>
    all.find((one) => one.id === id && one.kind === kind) ?? null;

  if (picked === 'qazinho') return null;

  return (
    find(picked) ??
    find(org?.templates.find((one) => one.kind === kind && one.isDefault)?.id)
  );
}
