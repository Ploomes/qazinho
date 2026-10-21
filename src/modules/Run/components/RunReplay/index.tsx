import { AnimatePresence, motion } from 'motion/react';
import { Button, IconButton, Intern } from '@/shared/components/atoms';
import { BACKDROP, STICKER } from '@/shared/constants';
import { ReplayLog, ReplayTimeline } from './components';
import { useRunReplayViewModel } from './hooks';
import './styles.css';

/** A run's video with its timeline: a chapter per case, a pin per bug, and the steps beside it, all kept in step. */
export const RunReplay: React.FC = () => {
  const {
    isOpen,
    kicker,
    title,
    closeLabel,
    canSave,
    isSaving,
    saveGlyph,
    saveLabel,
    url,
    hasVideo,
    src,
    videoRef,
    panelStyle,
    waitMood,
    waitSize,
    backdropTransition,
    swapTransition,
    isLoading,
    hasFailed,
    loadingText,
    missingText,
    caption,
    canWatchWhole,
    takeEndLabel,
    wholeLabel,
    timeline,
    moment,
    progress,
    currentMs,
    take,
    flashBugId,
    playGlyph,
    playLabel,
    timeText,
    chapterLabel,
    rateLabel,
    rateTitle,
    hasKeys,
    keysHint,
    onClose,
    onPanelClick,
    onSave,
    onLoaded,
    onPlay,
    onPause,
    onError,
    onTogglePlay,
    onSeek,
    onScrub,
    onRate,
    onWatchWhole,
  } = useRunReplayViewModel();

  if (!isOpen || timeline === null) return null;

  return (
    <motion.div
      className="run-replay"
      initial={{ opacity: 0, backdropFilter: BACKDROP.clear }}
      animate={{ opacity: 1, backdropFilter: BACKDROP.blur }}
      exit={{ opacity: 0, backdropFilter: BACKDROP.clear }}
      transition={backdropTransition}
      onClick={onClose}
    >
      <motion.section
        className="run-replay__panel"
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-label={kicker}
        initial={STICKER.panel.initial}
        animate={STICKER.panel.animate}
        exit={STICKER.panel.exit}
        onClick={onPanelClick}
      >
        <header className="run-replay__head">
          <span className="run-replay__kicker">{kicker}</span>
          <span className="run-replay__title">{title}</span>
          <span className="run-replay__actions">
            {canSave && (
              <Button size="sm" variant="ghost" disabled={isSaving} onClick={onSave}>
                <span aria-hidden="true">{saveGlyph}</span> {saveLabel}
              </Button>
            )}
            <IconButton glyph="✕" label={closeLabel} size="sm" onClick={onClose} />
          </span>
        </header>

        <div className="run-replay__body">
          <div className="run-replay__stage">
            <div className="run-replay__screen">
              {hasVideo && (
                <video
                  ref={videoRef}
                  className="run-replay__video"
                  src={src}
                  muted
                  playsInline
                  preload="auto"
                  onLoadedData={onLoaded}
                  onPlay={onPlay}
                  onPause={onPause}
                  onEnded={onPause}
                  onError={onError}
                />
              )}

              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    key="wait"
                    className="run-replay__wait"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={swapTransition}
                  >
                    <Intern mood={waitMood} size={waitSize} />
                    <span>{loadingText}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {hasFailed && <p className="run-replay__missing">{missingText}</p>}
            </div>

            <div className="run-replay__caption" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={caption.key}
                  className="run-replay__caption-line"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={swapTransition}
                >
                  <span className={caption.glyphClassName} aria-hidden="true">
                    {caption.glyph}
                  </span>
                  <span className="run-replay__caption-kicker">{caption.kicker}</span>
                  <span className="run-replay__caption-text">{caption.text}</span>
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <ReplayLog timeline={timeline} moment={moment} onSeek={onSeek} />
        </div>

        <ReplayTimeline
          timeline={timeline}
          progress={progress}
          currentMs={currentMs}
          take={take}
          flashBugId={flashBugId}
          url={url}
          onSeek={onSeek}
          onScrub={onScrub}
        />

        <div className="run-replay__controls">
          <button
            type="button"
            className="run-replay__play"
            aria-label={playLabel}
            onClick={onTogglePlay}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={playGlyph}
                className="run-replay__play-glyph"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={swapTransition}
              >
                {playGlyph}
              </motion.span>
            </AnimatePresence>
          </button>

          <span className="run-replay__time">{timeText}</span>

          <span className="run-replay__chapter">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={chapterLabel.key}
                className="run-replay__chapter-text"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={swapTransition}
              >
                {chapterLabel.text}
              </motion.span>
            </AnimatePresence>
          </span>

          <AnimatePresence>
            {canWatchWhole && (
              <motion.button
                key="whole"
                type="button"
                className="run-replay__whole"
                initial={STICKER.slap.initial}
                animate={STICKER.slap.animate}
                exit={STICKER.slap.exit}
                onClick={onWatchWhole}
              >
                <span className="run-replay__whole-end">{takeEndLabel}</span>
                {wholeLabel} <span aria-hidden="true">→</span>
              </motion.button>
            )}
          </AnimatePresence>

          {hasKeys && <span className="run-replay__keys">{keysHint}</span>}

          <button
            type="button"
            className="run-replay__rate"
            aria-label={rateTitle}
            title={rateTitle}
            onClick={onRate}
          >
            {rateLabel}
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
};
