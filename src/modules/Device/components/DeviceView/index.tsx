import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { Button, Eyebrow, Icon, Intern, StatusPill } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import {
  DeviceFocus,
  DeviceOff,
  LastRun,
  DeviceScreen,
  LiveClock,
  ManualPanel,
  ScreenRail,
  ViewportPicker,
} from './components';
import { useDeviceViewModel } from './hooks';
import './styles.css';

/**
 * O dispositivo que a run dirige: como está, a tela viva, o tamanho, pausar e parar, e os
 * passos que andou.
 */
export const DeviceView: React.FC = () => {
  const {
    isFocused,
    canFocus,
    focusLabel,
    focusedText,
    frameLayoutId,
    frameTransition,
    onFocus,
    onUnfocus,
    style,
    isPhone,
    hasScreen,
    rootClassName,
    hasRail,
    railLabel,
    screens,
    stackClassName,
    swap,
    pickedNotice,
    onPickScreen,
    onFollowAgent,
    viewportClassName,
    hasControls,
    pauseLabel,
    stateText,
    mood,
    viewports,
    hasViewportPicker,
    screenRatio,
    hasManualPanel,
    fitsWhole,
    onTouch,
    onSelectViewport,
    shot,
    stream,
    urlText,
    elapsedLabel,
    isLive,
    steps,
    sections,
    hasSteps,
    hasState,
    offTitle,
    offDetail,
    offMood,
    ended,
    start,
    lastShot,
    lastRun,
    doingLabel,
    stepsWord,
    stepsRef,
    onStepsScroll,
    onPause,
    onStop,
    doingNow,
    hasCaption,
    caption,
    question,
    onAnswerQuestion,
  } = useDeviceViewModel();

  return (
    <div className={rootClassName} style={style}>
      <AnimatePresence initial={false}>
        {hasScreen && (
          <motion.div
            key="header"
            className="device-view__fold"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <header className="device-view__header">
              {hasState && (
                <span className="device-view__state">
                  <Intern mood={mood} size={22} isStill />
                  <span className="device-view__state-text">{stateText}</span>
                  {isLive && <LiveClock label={elapsedLabel} />}
                </span>
              )}
              {pickedNotice !== null && (
                <button
                  type="button"
                  className="device-view__follow"
                  onClick={onFollowAgent}
                >
                  {pickedNotice}
                </button>
              )}
              <span className="device-view__collapse">
                {hasViewportPicker && (
                  <ViewportPicker viewports={viewports} onSelect={onSelectViewport} />
                )}
                <AnimatePresence initial={false}>
                  {canFocus && (
                    <motion.span
                      key="focus"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
                    >
                      <Button size="sm" variant="secondary" onClick={onFocus}>
                        <Icon name="focus" />
                        <span className="device-view__focus-label">{focusLabel}</span>
                      </Button>
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </header>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={viewportClassName}>
        {hasRail && (
          <ScreenRail label={railLabel} screens={screens} onPick={onPickScreen} />
        )}

        <div className="device-view__stage">
          {!hasScreen && isPhone && (
            <div className="device-view__phone">
              <DeviceOff
                title={offTitle}
                detail={offDetail}
                mood={offMood}
                ended={ended}
                start={start}
                shot={lastShot}
              />
            </div>
          )}

          {!hasScreen && !isPhone && (
            <div className="device-view__browser">
              <div className="device-view__chrome">
                <span className="device-view__dot" />
                <span className="device-view__dot" />
                <span className="device-view__dot" />
                <span className="device-view__url">{urlText}</span>
              </div>
              <DeviceOff
                title={offTitle}
                detail={offDetail}
                mood={offMood}
                ended={ended}
                start={start}
                shot={lastShot}
              />
            </div>
          )}

          {hasScreen && isFocused && (
            <p className="device-view__focused">{focusedText}</p>
          )}

          {hasScreen && !isFocused && isPhone && (
            <motion.div
              layoutId={frameLayoutId}
              transition={frameTransition}
              className="device-view__phone"
            >
              <DeviceScreen
                shot={shot}
                stream={stream}
                ratio={screenRatio}
                fitsWhole={fitsWhole}
                onTouch={onTouch}
              />
            </motion.div>
          )}

          {hasScreen && !isFocused && !isPhone && (
            <motion.div
              layoutId={frameLayoutId}
              transition={frameTransition}
              className={stackClassName}
            >
              <div className="device-view__chrome">
                <span className="device-view__dot" />
                <span className="device-view__dot" />
                <span className="device-view__dot" />
                <span className="device-view__url">{urlText}</span>
              </div>
              <motion.div className="device-view__swap" animate={swap}>
                <DeviceScreen
                  shot={shot}
                  stream={stream}
                  ratio={screenRatio}
                  fitsWhole={fitsWhole}
                  onTouch={onTouch}
                />
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {hasManualPanel && <ManualPanel />}

      {lastRun !== null && <LastRun {...lastRun} />}

      {hasCaption && (
        <p className="device-view__caption" role="status">
          <span className="device-view__caption-mark">
            <Icon name="running" />
          </span>
          {caption}
        </p>
      )}

      <AnimatePresence initial={false}>
        {hasSteps && (
          <motion.div
            key="steps"
            className="device-view__steps"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <Eyebrow>
              {stepsWord} {doingLabel}
            </Eyebrow>
            <div ref={stepsRef} className="device-view__list" onScroll={onStepsScroll}>
              {sections.map((section) => (
                <div key={section.key} className="device-view__section">
                  {section.title !== '' && (
                    <span className="device-view__case">{section.title}</span>
                  )}
                  {section.rows.map((step) => (
                    <div key={step.number} className="device-view__step">
                      <StatusPill status={step.verdict} label="" />
                      <span>{step.action}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {createPortal(
        <AnimatePresence>
          {isFocused && (
            <DeviceFocus
              key="focus"
              isPhone={isPhone}
              railLabel={railLabel}
              screens={screens}
              swap={swap}
              pickedNotice={pickedNotice}
              onPickScreen={onPickScreen}
              onFollowAgent={onFollowAgent}
              shot={shot}
              stream={stream}
              isLive={isLive}
              elapsedLabel={elapsedLabel}
              urlText={urlText}
              stateText={stateText}
              mood={mood}
              steps={steps}
              doingLabel={doingLabel}
              doingNow={doingNow}
              stepsWord={stepsWord}
              hasControls={hasControls}
              pauseLabel={pauseLabel}
              viewports={viewports}
              ratio={screenRatio}
              onSelectViewport={onSelectViewport}
              onPause={onPause}
              onStop={onStop}
              onClose={onUnfocus}
              question={question}
              onAnswerQuestion={onAnswerQuestion}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};
