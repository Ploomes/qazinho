import type { ITellStoryModalProps } from './types';
import { ModalFrame } from '@/shared/components/templates';
import { useTellStoryModalViewModel } from './hooks';
import './styles.css';

/** O que o plano decidiu sobre uma mudança, num comentário que o QA edita e posta. */
export const TellStoryModal: React.FC<ITellStoryModalProps> = (props) => {
  const {
    title,
    subtitle,
    width,
    label,
    text,
    confirmLabel,
    canConfirm,
    hint,
    onText,
    onCancel,
    onConfirm,
  } = useTellStoryModalViewModel(props);

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
      <label className="tell-story">
        <span className="tell-story__label">{label}</span>
        <textarea
          className="tell-story__text"
          value={text}
          aria-label={label}
          onChange={onText}
        />
      </label>
    </ModalFrame>
  );
};
