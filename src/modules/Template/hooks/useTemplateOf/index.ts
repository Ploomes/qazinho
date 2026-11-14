import type { TemplateKind } from '@/shared/types';
import { templateFor } from '@/modules/Template/library';
import { useAppStore, useProStore, useTemplateStore } from '@/store';

export const useTemplateOf =
  () =>
  ({ kind, projectId }: { kind: TemplateKind; projectId: string }) => {
    const orgSlug = useProStore
      .getState()
      .shares.find((share) => share.projectId === projectId)?.orgSlug;
    const { templates, orgTemplates } = useTemplateStore.getState();

    return templateFor({
      kind,
      chosen: useAppStore.getState().projects.find(({ id }) => id === projectId)
        ?.templates,
      templates,
      org: orgTemplates.find((one) => one.orgSlug === orgSlug),
    });
  };
