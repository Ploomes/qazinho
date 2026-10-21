import type { IReplayTimelineProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/shared/components/atoms';
import { MOTION, STICKER } from '@/shared/constants';
import { ReplayPreview } from './components';
import { useReplayTimelineViewModel } from './hooks';
import './styles.css';

/** The run's video as chapters, one per case in its verdict's colour, with a tick per step, a pin per bug, a mark per failed request and a still under the cursor. */
export const ReplayTimeline: React.FC<IReplayTimelineProps> = (props) => {
  const {
    style,
    label,
    valueNow,
    valueMax,
    valueText,
    playedClip,
    playheadLeft,
    chapters,
    take,
    faults,
    faultTransition,
    pins,
    preview,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
  } = useReplayTimelineViewModel(props);

  return (
    <div className="replay-timeline" style={style}>
      <div className="replay-timeline__pins">
        {pins.map((pin) => (
          <motion.button
            key={pin.key}
            type="button"
            className={pin.className}
            style={pin.style}
            aria-label={pin.label}
            initial={STICKER.pop.initial}
            animate={pin.animate}
            onClick={pin.onClick}
          >
            <span className="replay-timeline__pin-mark">
              <Icon name="bug" />
            </span>
            <AnimatePresence>
              {pin.isFlashing && (
                <motion.span
                  key="callout"
                  className={pin.calloutClassName}
                  initial={STICKER.slap.initial}
                  animate={STICKER.slap.animate}
                  exit={STICKER.slap.exit}
                >
                  <span className="replay-timeline__callout-id">{pin.callout}</span>
                  <span className="replay-timeline__callout-title">{pin.title}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      <div
        className="replay-timeline__rail"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={valueMax}
        aria-valuenow={valueNow}
        aria-valuetext={valueText}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        <div className="replay-timeline__track">
          {chapters.map((chapter) => (
            <motion.div
              key={chapter.key}
              className={chapter.className}
              style={chapter.style}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                duration: MOTION.durationSlow,
                ease: MOTION.ease,
                delay: chapter.delay,
              }}
            >
              {chapter.ticks.map((tick) => (
                <span
                  key={tick.key}
                  className="replay-timeline__tick"
                  style={tick.style}
                />
              ))}
            </motion.div>
          ))}

          <motion.div
            className="replay-timeline__played"
            style={{ clipPath: playedClip }}
          >
            {chapters.map((chapter) => (
              <span
                key={chapter.key}
                className={chapter.playedClassName}
                style={chapter.style}
              />
            ))}
          </motion.div>

          {take !== null && <span className="replay-timeline__take" style={take.style} />}

          <AnimatePresence initial={false}>
            {faults.map((fault) => (
              <motion.span
                key={fault.key}
                className="replay-timeline__fault"
                style={fault.style}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={faultTransition}
              />
            ))}
          </AnimatePresence>

          <motion.span className="replay-timeline__head" style={{ left: playheadLeft }} />
        </div>

        <div className={preview.className} style={preview.style} aria-hidden="true">
          <ReplayPreview url={props.url} ms={preview.ms} />
          <span className="replay-timeline__preview-time">{preview.time}</span>
          <span className="replay-timeline__preview-chapter">{preview.chapter}</span>
          <span className="replay-timeline__preview-step">{preview.step}</span>
        </div>
      </div>
    </div>
  );
};
