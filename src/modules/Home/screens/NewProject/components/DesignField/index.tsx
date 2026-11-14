import type { IDesignFieldProps } from './types';
import { FieldCard } from '@/modules/Home/screens/NewProject/components/FieldCard';
import { Input } from '@/shared/components/atoms';
import { useDesignFieldViewModel } from './hooks';

/** O campo do link do Figma, que diz qual frame ou página ele abre. */
export const DesignField: React.FC<IDesignFieldProps> = (props) => {
  const view = useDesignFieldViewModel(props);

  return (
    <FieldCard
      icon="figma"
      label={view.label}
      statusText={view.statusText}
      statusClassName={view.statusClassName}
    >
      <Input
        isMono
        value={view.text}
        label={view.label}
        placeholder={view.placeholder}
        onChange={view.onText}
      />
    </FieldCard>
  );
};
