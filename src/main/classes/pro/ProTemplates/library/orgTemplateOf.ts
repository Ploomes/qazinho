import type { ORG_TEMPLATE_SCHEMA } from '@/main/classes/pro/ProApi/constants';
import type { IOrgTemplate } from '@/shared/types';
import type { z } from 'zod';
import { orgTemplateIdOf } from './orgTemplateIdOf';

/** Um modelo como a org o respondeu, guardado aqui com o id que diz de qual org ele é. */
export function orgTemplateOf(props: {
  orgSlug: string;
  template: z.infer<typeof ORG_TEMPLATE_SCHEMA>;
}): IOrgTemplate {
  const { orgSlug, template } = props;

  return {
    id: orgTemplateIdOf({ orgSlug, id: template.id }),
    kind: template.kind,
    name: template.name,
    title: template.title,
    parts: template.parts,
    cases: template.cases,
    updatedAt: template.updatedAt,
    orgSlug,
    isDefault: template.isDefault,
    author: template.author.name,
  };
}
