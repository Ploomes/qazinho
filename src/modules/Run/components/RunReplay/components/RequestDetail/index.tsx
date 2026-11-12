import type { IRequestDetailProps } from './types';
import { motion } from 'motion/react';
import { Button, Icon, IconButton } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useRequestDetailViewModel } from './hooks';
import './styles.css';

/**
 * Um pedido da run aberto sobre o teatro: o status, o endereço inteiro, quanto levou, o
 * erro e o que uma chamada que falhou respondeu, e o caminho até ele no vídeo.
 */
export const RequestDetail: React.FC<IRequestDetailProps> = (props) => {
  const {
    cardRef,
    style,
    transition,
    label,
    method,
    path,
    statusClassName,
    statusIcon,
    statusText,
    url,
    facts,
    hasFailure,
    failureLabel,
    failure,
    hasBody,
    bodyLabel,
    body,
    hasNote,
    note,
    closeLabel,
    copyLabel,
    seeLabel,
    onBackdropClick,
    onCardClick,
    onCopy,
    onSee,
    onClose,
  } = useRequestDetailViewModel(props);

  return (
    <motion.div
      className="request-detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition}
      onClick={onBackdropClick}
    >
      <motion.section
        ref={cardRef}
        className="request-detail__card"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={style}
        initial={STICKER.panel.initial}
        animate={STICKER.panel.animate}
        exit={STICKER.panel.exit}
        onClick={onCardClick}
      >
        <header className="request-detail__head">
          <span className={statusClassName}>
            <Icon name={statusIcon} />
            {statusText}
          </span>
          <h2 className="request-detail__title">
            <span className="request-detail__method">{method}</span>
            <span className="request-detail__path">{path}</span>
          </h2>
          <IconButton icon="close" label={closeLabel} size="sm" onClick={onClose} />
        </header>

        <p className="request-detail__url">{url}</p>

        <dl className="request-detail__facts">
          {facts.map((fact) => (
            <div key={fact.id} className="request-detail__fact">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        {hasFailure && (
          <div className="request-detail__block">
            <p className="request-detail__label">{failureLabel}</p>
            <p className="request-detail__failure">{failure}</p>
          </div>
        )}

        {hasBody && (
          <div className="request-detail__block">
            <p className="request-detail__label">{bodyLabel}</p>
            <pre className="request-detail__body">{body}</pre>
          </div>
        )}

        <footer className="request-detail__foot">
          {hasNote && <p className="request-detail__note">{note}</p>}
          <div className="request-detail__actions">
            <Button variant="secondary" onClick={onCopy}>
              {copyLabel}
            </Button>
            <Button variant="primary" onClick={onSee}>
              {seeLabel}
            </Button>
          </div>
        </footer>
      </motion.section>
    </motion.div>
  );
};
