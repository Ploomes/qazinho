import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon, IconButton, Intern, Switch } from '@/shared/components/atoms';
import { BACKDROP, STICKER } from '@/shared/constants';
import { ReplayLog, ReplayNetwork, ReplayTimeline } from './components';
import { useRunReplayViewModel } from './hooks';
import './styles.css';

/**
 * A run's video with its timeline: a chapter per case, a pin per bug, the steps beside it
 * and, when the QA asks, the requests under it, all kept in step.
 */
export const RunReplay: React.FC = () => {
  const {
    isOpen,
    kicker,
    title,
    closeLabel,
    canSave,
    isSaving,
    saveIcon,
    saveLabel,
    isPreparing,
    preparingLabel,
    preparedPercent,
    preparingStyle,
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
    hasNetwork,
    isNetworkShown,
    networkLabel,
    networkTip,
    requests,
    isShowingFiles,
    faults,
    foldTransition,
    canWatchWhole,
    takeEndLabel,
    wholeLabel,
    timeline,
    moment,
    progress,
    currentMs,
    take,
    flashBugId,
    playIcon,
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
    onToggleNetwork,
    onToggleFiles,
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
            {hasNetwork && (
              <Switch
                icon="network"
                label={networkLabel}
                title={networkTip}
                isOn={isNetworkShown}
                onChange={onToggleNetwork}
              />
            )}
            <AnimatePresence mode="wait" initial={false}>
              {isPreparing ? (
                <motion.span
                  key="preparing"
                  className="run-replay__preparing"
                  role="progressbar"
                  aria-label={preparingLabel}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={preparedPercent}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={swapTransition}
                >
                  <span className="run-replay__preparing-icon">
                    <Icon name="pending" />
                  </span>
                  {preparingLabel}
                  <span className="run-replay__preparing-track">
                    <span className="run-replay__preparing-fill" style={preparingStyle} />
                  </span>
                </motion.span>
              ) : (
                canSave && (
                  <motion.span
                    key="save"
                    className="run-replay__save"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={swapTransition}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isSaving}
                      onClick={onSave}
                    >
                      <Icon name={saveIcon} /> {saveLabel}
                    </Button>
                  </motion.span>
                )
              )}
            </AnimatePresence>
            <IconButton icon="close" label={closeLabel} size="sm" onClick={onClose} />
          </span>
        </header>

        <div className="run-replay__body">
          <div className="run-replay__stage">
            <div className="run-replay__screen">
              <div className="run-replay__view">
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

              <AnimatePresence initial={false}>
                {isNetworkShown && (
                  <motion.div
                    key="network"
                    className="run-replay__network"
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={foldTransition}
                  >
                    <ReplayNetwork
                      requests={requests}
                      currentMs={currentMs}
                      isShowingFiles={isShowingFiles}
                      onToggleFiles={onToggleFiles}
                      onSeek={onSeek}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
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
                  <span className={caption.iconClassName}>
                    <Icon name={caption.icon} />
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
          faults={faults}
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
                key={playIcon}
                className="run-replay__play-icon"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={swapTransition}
              >
                <Icon name={playIcon} size={14} />
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
                {wholeLabel} <Icon name="arrow" />
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
