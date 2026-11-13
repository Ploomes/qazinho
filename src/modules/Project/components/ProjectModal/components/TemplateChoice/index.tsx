import type { ITemplateChoiceProps } from './types';
import { useTemplateChoiceViewModel } from './hooks';
import './styles.css';

/** O modelo que o projeto usa em cada coisa: o do QAzinho ou um do time, num toque. */
export const TemplateChoice: React.FC<ITemplateChoiceProps> = (props) => {
  const { note, kinds } = useTemplateChoiceViewModel(props);

  return (
    <div className="template-choice">
      <p className="template-choice__note">{note}</p>
      {kinds.map((kind) => (
        <div
          key={kind.kind}
          className="template-choice__kind"
          role="radiogroup"
          aria-label={kind.label}
        >
          <span className="template-choice__label">{kind.label}</span>
          <div className="template-choice__options">
            {kind.options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={option.isOn}
                className={option.className}
                onClick={option.onPick}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
