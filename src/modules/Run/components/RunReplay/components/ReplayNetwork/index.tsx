import type { IReplayNetworkProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/shared/components/atoms';
import { useReplayNetworkViewModel } from './hooks';
import './styles.css';

/**
 * Os pedidos que o app fez, sob o vídeo e em sincronia com ele: cada um cai quando
 * começa, espera a resposta, e leva o vídeo até lá num clique.
 */
export const ReplayNetwork: React.FC<IReplayNetworkProps> = (props) => {
  const {
    style,
    title,
    count,
    hasErrors,
    errors,
    hasFiles,
    isShowingFiles,
    filesLabel,
    filesTitle,
    listRef,
    hasEarlier,
    earlier,
    isEmpty,
    empty,
    rowLand,
    rowTransition,
    nowTransition,
    swapTransition,
    rows,
    onToggleFiles,
    onUserScroll,
  } = useReplayNetworkViewModel(props);

  return (
    <section className="replay-network" style={style} aria-label={title}>
      <header className="replay-network__head">
        <span className="replay-network__title">
          <Icon name="network" />
          {title}
        </span>
        <span className="replay-network__count">{count}</span>

        <AnimatePresence initial={false}>
          {hasErrors && (
            <motion.span
              key="errors"
              className="replay-network__errors"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={swapTransition}
            >
              <Icon name="attention" />
              {errors}
            </motion.span>
          )}
        </AnimatePresence>

        {hasFiles && (
          <button
            type="button"
            className="replay-network__files"
            aria-pressed={isShowingFiles}
            title={filesTitle}
            onClick={onToggleFiles}
          >
            {filesLabel}
          </button>
        )}
      </header>

      <ol
        ref={listRef}
        className="replay-network__list"
        onWheel={onUserScroll}
        onTouchMove={onUserScroll}
      >
        {hasEarlier && <li className="replay-network__note">{earlier}</li>}

        {rows.map((row) => (
          <motion.li
            key={row.key}
            className={row.className}
            initial={row.initial}
            animate={rowLand}
            transition={rowTransition}
          >
            <button
              type="button"
              className="replay-network__button"
              title={row.title}
              onClick={row.onClick}
            >
              {row.isLatest && (
                <motion.span
                  layoutId="replay-network-now"
                  className="replay-network__now"
                  transition={nowTransition}
                />
              )}
              <span className="replay-network__clock">{row.clock}</span>
              <span className="replay-network__method">{row.method}</span>
              <span className={row.statusClassName} aria-label={row.statusLabel}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={row.statusKey}
                    className="replay-network__status-face"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={swapTransition}
                  >
                    <span className={row.iconClassName}>
                      <Icon name={row.icon} />
                    </span>
                    {row.statusText}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="replay-network__url">
                {row.hasHost && <span className="replay-network__host">{row.host}</span>}
                <span className="replay-network__path">{row.path}</span>
              </span>
              <span className="replay-network__type">{row.type}</span>
              <span className="replay-network__bar">
                <span className={row.fillClassName} style={row.fillStyle} />
              </span>
              <span className="replay-network__time">{row.time}</span>
              <span className="replay-network__size">{row.size}</span>
            </button>
          </motion.li>
        ))}

        {isEmpty && (
          <li className="replay-network__note replay-network__note--empty">{empty}</li>
        )}
      </ol>
    </section>
  );
};
