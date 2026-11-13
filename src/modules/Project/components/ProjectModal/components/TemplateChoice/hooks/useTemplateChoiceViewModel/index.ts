import type { ITemplateChoiceProps } from '@/modules/Project/components/ProjectModal/components/TemplateChoice/types';
import type { TemplateKind } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { TEMPLATE_KIND_KEYS } from '@/modules/Template';
import { useTemplateStore } from '@/store';

export const useTemplateChoiceViewModel = (props: ITemplateChoiceProps) => {
  const { chosen, onChange } = props;
  const { t } = useTranslation();
  const templates = useTemplateStore((state) => state.templates);

  return {
    note: t('PROJECT.TEMPLATES_NOTE'),
    kinds: (Object.keys(TEMPLATE_KIND_KEYS) as TemplateKind[]).map((kind) => {
      const options = [
        { id: 'qazinho', label: t('PROJECT.TEMPLATE_QAZINHO') },
        ...templates
          .filter((one) => one.kind === kind)
          .map(({ id, name }) => ({ id, label: name })),
      ];

      const picked = options.some(({ id }) => id === chosen[kind])
        ? (chosen[kind] ?? 'qazinho')
        : 'qazinho';

      return {
        kind,
        label: t(TEMPLATE_KIND_KEYS[kind]),
        options: options.map((option) => ({
          ...option,
          isOn: option.id === picked,
          className:
            option.id === picked
              ? 'template-choice__option template-choice__option--on'
              : 'template-choice__option',
          onPick: () => {
            const { [kind]: _before, ...rest } = chosen;

            onChange(option.id === 'qazinho' ? rest : { ...rest, [kind]: option.id });
          },
        })),
      };
    }),
  };
};
