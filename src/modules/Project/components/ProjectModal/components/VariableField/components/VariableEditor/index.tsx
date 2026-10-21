import type { IVariableEditorProps } from './types';
import { VariableForm } from '@/modules/Project/components/VariableForm';
import { Button } from '@/shared/components/atoms';
import { useVariableEditorViewModel } from './hooks';
import './styles.css';

/** One variable opened in place: its form, what stops it from being kept, and the way out either way. */
export const VariableEditor: React.FC<IVariableEditorProps> = (props) => {
  const { ref } = useVariableEditorViewModel();

  return (
    <div ref={ref} className="variable-editor">
      <VariableForm
        name={props.name}
        description={props.description}
        value={props.value}
        valuePlaceholder={props.valuePlaceholder}
        note=""
        isNameFocused
        isValueFocused={false}
        onName={props.onName}
        onDescription={props.onDescription}
        onValue={props.onValue}
      />
      <div className="variable-editor__foot">
        <span className="variable-editor__problem">{props.problem}</span>
        <Button size="sm" variant="ghost" onClick={props.onCancel}>
          {props.cancelLabel}
        </Button>
        <Button size="sm" disabled={!props.canFinish} onClick={props.onDone}>
          {props.doneLabel}
        </Button>
      </div>
    </div>
  );
};
