import { Eyebrow, Input } from '@/components/atoms';
import { ModalFrame } from '@/components/templates';
import { useNewWorkspaceModalViewModel } from './hooks';
import './styles.css';

export const NewWorkspaceModal: React.FC = () => {
  const {
    name,
    targets,
    chosenTargetId,
    projectName,
    canCreate,
    onNameChange,
    onTargetChange,
    onCancel,
    onCreate,
  } = useNewWorkspaceModalViewModel();

  return (
    <ModalFrame
      title="New workspace"
      subtitle={`One front of testing in ${projectName}. It gets its own chat, device, plan and runs.`}
      width={520}
      confirmLabel="Create workspace"
      canConfirm={canCreate}
      hint="nothing starts until you ask for a run"
      onCancel={onCancel}
      onConfirm={onCreate}
    >
      <div>
        <Eyebrow>what are you testing</Eyebrow>
        <Input
          value={name}
          label="what are you testing"
          placeholder="Checkout regression"
          onChange={onNameChange}
        />
      </div>

      <div>
        <Eyebrow>target</Eyebrow>
        <div className="new-workspace__targets">
          {targets.map((target) => (
            <button
              key={target.id}
              type="button"
              className={
                target.id === chosenTargetId
                  ? 'new-workspace__target new-workspace__target--chosen'
                  : 'new-workspace__target'
              }
              onClick={() => {
                onTargetChange(target.id);
              }}
            >
              {target.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Eyebrow>linked issue · optional</Eyebrow>
        <p className="new-workspace__issue">
          No issue tracker connected. Connect one and you can hand the agent a ticket to
          work from. Without it you and the agent write the plan together.
        </p>
      </div>
    </ModalFrame>
  );
};
