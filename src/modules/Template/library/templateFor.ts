import type { ITemplate, TemplateKind } from '@/shared/types';

/**
 * O modelo que vale para um projeto: o que o QA escolheu nele, senão o padrão da org do
 * projeto, senão nenhum, e o QAzinho monta do jeito dele.
 */
export function templateFor(props: {
  kind: TemplateKind;
  chosen: Partial<Record<TemplateKind, string>> | undefined;
  templates: ITemplate[];
  orgDefault: string | null;
}): ITemplate | null {
  const picked = props.chosen?.[props.kind];
  const find = (id: string | null | undefined) =>
    props.templates.find((one) => one.id === id && one.kind === props.kind) ?? null;

  if (picked === 'qazinho') return null;

  return find(picked) ?? find(props.orgDefault);
}
