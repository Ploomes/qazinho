import type { IWebFieldProps } from './types';
import { FieldCard } from '@/modules/Home/screens/NewProject/components/FieldCard';
import { Input } from '@/shared/components/atoms';
import { useWebFieldViewModel } from './hooks';

/** O campo do endereço do app, que diz na hora se o que foi digitado já é um. */
export const WebField: React.FC<IWebFieldProps> = (props) => {
  const view = useWebFieldViewModel(props);

  return (
    <FieldCard
      icon="web"
      label={view.label}
      statusText={view.statusText}
      statusClassName={view.statusClassName}
    >
      <Input
        isMono
        isAutoFocused
        value={view.value}
        label={view.label}
        placeholder={view.placeholder}
        onChange={view.onChange}
      />
    </FieldCard>
  );
};
