import type { ITestsFieldProps } from './types';
import { FieldCard } from '@/modules/Home/screens/NewProject/components/FieldCard';
import { Button, Icon } from '@/shared/components/atoms';
import { useTestsFieldViewModel } from './hooks';
import './styles.css';

/** O campo da pasta de testes do time, que diz o framework que o QAzinho reconheceu. */
export const TestsField: React.FC<ITestsFieldProps> = (props) => {
  const view = useTestsFieldViewModel(props);

  return (
    <FieldCard
      icon="tests"
      label={view.label}
      statusText={view.statusText}
      statusClassName={view.statusClassName}
    >
      <div className="tests-field">
        <Button size="sm" disabled={view.isPicking} onClick={view.onPick}>
          <Icon name="folder" />
          {view.pickLabel}
        </Button>
        {view.hasPath && <span className="tests-field__path">{view.path}</span>}
      </div>
    </FieldCard>
  );
};
