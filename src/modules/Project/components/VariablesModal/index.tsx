import { VariableForm } from '@/modules/Project/components/VariableForm';
import { ModalFrame } from '@/shared/components/templates';
import { useVariablesModalViewModel } from './hooks';
import './styles.css';

/**
 * A janela em que o agente pede ao QA que digite segredos: um formulário por variável,
 * lacrado na main depois de salvo, e nunca mostrado de novo.
 */
export const VariablesModal: React.FC = () => {
  const {
    width,
    title,
    valuePlaceholder,
    rows,
    hint,
    confirmLabel,
    canConfirm,
    onCancel,
    onConfirm,
  } = useVariablesModalViewModel();

  return (
    <ModalFrame
      title={title}
      width={width}
      confirmLabel={confirmLabel}
      canConfirm={canConfirm}
      hint={hint}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div className="variables-modal__rows">
        {rows.map((row) => (
          <VariableForm
            key={row.key}
            name={row.name}
            description={row.description}
            value={row.value}
            valuePlaceholder={valuePlaceholder}
            note={row.note}
            isValueOnly={row.isValueOnly}
            isNameFocused={false}
            isValueFocused={row.isValueFocused}
            onName={row.onName}
            onDescription={row.onDescription}
            onValue={row.onValue}
          />
        ))}
      </div>
    </ModalFrame>
  );
};
