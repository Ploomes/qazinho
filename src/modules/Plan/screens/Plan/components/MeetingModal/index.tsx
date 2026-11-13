import type { IMeetingModalProps } from './types';
import { Icon } from '@/shared/components/atoms';
import { ModalFrame } from '@/shared/components/templates';
import { useMeetingModalViewModel } from './hooks';
import './styles.css';

/** A transcrição de uma reunião, solta ou colada, que vira as trocas do plano. */
export const MeetingModal: React.FC<IMeetingModalProps> = (props) => {
  const {
    title,
    subtitle,
    width,
    accept,
    pickLabel,
    textLabel,
    text,
    file,
    confirmLabel,
    canConfirm,
    onFile,
    onDragOver,
    onDrop,
    onText,
    onCancel,
    onConfirm,
  } = useMeetingModalViewModel(props);

  return (
    <ModalFrame
      title={title}
      subtitle={subtitle}
      width={width}
      confirmLabel={confirmLabel}
      canConfirm={canConfirm}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <div className="meeting-modal" onDragOver={onDragOver} onDrop={onDrop}>
        <label className="meeting-modal__pick">
          <Icon name="attach" />
          {file === null ? (
            pickLabel
          ) : (
            <span className="meeting-modal__file">
              <span className="meeting-modal__file-name">{file.name}</span>
              {file.minutes !== '' && (
                <span className="meeting-modal__file-minutes">{file.minutes}</span>
              )}
            </span>
          )}
          <input
            className="meeting-modal__input"
            type="file"
            accept={accept}
            onChange={onFile}
          />
        </label>
        <textarea
          className="meeting-modal__text"
          value={text}
          aria-label={textLabel}
          placeholder={textLabel}
          onChange={onText}
        />
      </div>
    </ModalFrame>
  );
};
