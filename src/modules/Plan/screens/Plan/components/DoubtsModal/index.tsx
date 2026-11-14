import type { IDoubtsModalProps } from './types';
import { Icon, Input, Switch } from '@/shared/components/atoms';
import { ModalFrame } from '@/shared/components/templates';
import { useDoubtsModalViewModel } from './hooks';
import './styles.css';

/**
 * As dúvidas indo à história num comentário do QA: a abertura, cada dúvida pelo id, quem
 * ele menciona, e se o QA passa a acompanhar a história.
 */
export const DoubtsModal: React.FC<IDoubtsModalProps> = (props) => {
  const {
    title,
    subtitle,
    width,
    confirmLabel,
    canConfirm,
    hint,
    introLabel,
    intro,
    mention,
    questions,
    closing,
    isWatching,
    watchingLabel,
    watchLabel,
    wantsToWatch,
    onIntro,
    onQuestion,
    onWatch,
    onCancel,
    onConfirm,
  } = useDoubtsModalViewModel(props);

  return (
    <ModalFrame
      title={title}
      subtitle={subtitle}
      width={width}
      confirmLabel={confirmLabel}
      canConfirm={canConfirm}
      hint={hint}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div className="doubts-modal">
        <label className="doubts-modal__part">
          <span className="doubts-modal__label">{introLabel}</span>
          {mention !== null && (
            <span className="doubts-modal__mention">
              <Icon name="account" />
              {mention}
            </span>
          )}
          <Input value={intro} label={introLabel} onChange={onIntro} />
        </label>

        <div className="doubts-modal__part">
          {questions.map((question) => (
            <label key={question.id} className="doubts-modal__doubt">
              <span className="doubts-modal__id">{question.id}</span>
              <Input
                value={question.value}
                label={question.label}
                onChange={(value) => {
                  onQuestion({ id: question.id, value });
                }}
              />
            </label>
          ))}
          <p className="doubts-modal__note">{closing}</p>
        </div>

        {isWatching ? (
          <p className="doubts-modal__note">{watchingLabel}</p>
        ) : (
          <Switch label={watchLabel} isOn={wantsToWatch} icon="eye" onChange={onWatch} />
        )}
      </div>
    </ModalFrame>
  );
};
