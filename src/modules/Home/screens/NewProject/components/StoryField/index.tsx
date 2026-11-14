import type { IStoryFieldProps } from './types';
import { FieldCard } from '@/modules/Home/screens/NewProject/components/FieldCard';
import { IntegrationCard } from '@/modules/Setup';
import { Button, Input } from '@/shared/components/atoms';
import { useStoryFieldViewModel } from './hooks';
import './styles.css';

/**
 * O campo da história: a chave ou o link de uma do Jira, ou de uma página do Confluence,
 * lida na hora; sem o Jira, o cartão para conectá-lo ali mesmo.
 */
export const StoryField: React.FC<IStoryFieldProps> = (props) => {
  const view = useStoryFieldViewModel(props);

  return (
    <FieldCard
      icon="story"
      label={view.label}
      statusText={view.statusText}
      statusClassName={view.statusClassName}
    >
      {view.hasIntegration && view.integration !== null && (
        <IntegrationCard integration={view.integration} />
      )}
      {!view.needsJira && (
        <div className="story-field">
          <Input
            value={view.text}
            label={view.label}
            placeholder={view.placeholder}
            onChange={view.onText}
            onKeyDown={view.onKeyDown}
          />
          <Button size="sm" disabled={!view.canRead} onClick={view.onRead}>
            {view.readLabel}
          </Button>
        </div>
      )}
    </FieldCard>
  );
};
