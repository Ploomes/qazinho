import { AnimatePresence, motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { Button, Eyebrow, Icon, Intern, StatusPill } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import {
  DeviceFocus,
  DeviceOff,
  DeviceScreen,
  LiveClock,
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
    viewportClassName,
    hasControls,
    pauseLabel,
    stateText,
    mood,
    viewports,
    hasViewportPicker,
    screenRatio,
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
    ended,
    doingLabel,
    stepsWord,
    stepsRef,
    onStepsScroll,
    onPause,
    onStop,
    doingNow,
  } = useDeviceViewModel();

  return (
    <div className="device-view" style={style}>
      {hasScreen && (
        <header className="device-view__header">
          {hasState && (
            <span className="device-view__state">
              <Intern mood={mood} size={22} isStill />
              <span className="device-view__state-text">{stateText}</span>
              {isLive && <LiveClock label={elapsedLabel} />}
            </span>
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
      )}

      <div className={viewportClassName}>
        {!hasScreen && isPhone && (
          <div className="device-view__phone">
            <DeviceOff title={offTitle} ended={ended} />
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
            <DeviceOff title={offTitle} ended={ended} />
          </div>
        )}

        {hasScreen && isFocused && <p className="device-view__focused">{focusedText}</p>}

        {hasScreen && !isFocused && isPhone && (
          <motion.div
            layoutId={frameLayoutId}
            transition={frameTransition}
            className="device-view__phone"
          >
            <DeviceScreen shot={shot} stream={stream} ratio={screenRatio} />
          </motion.div>
        )}

        {hasScreen && !isFocused && !isPhone && (
          <motion.div
            layoutId={frameLayoutId}
            transition={frameTransition}
            className="device-view__browser"
          >
            <div className="device-view__chrome">
              <span className="device-view__dot" />
              <span className="device-view__dot" />
              <span className="device-view__dot" />
              <span className="device-view__url">{urlText}</span>
            </div>
            <DeviceScreen shot={shot} stream={stream} ratio={screenRatio} />
          </motion.div>
        )}
      </div>

      {hasSteps && (
        <div ref={stepsRef} className="device-view__steps" onScroll={onStepsScroll}>
          <Eyebrow>
            {stepsWord} {doingLabel}
          </Eyebrow>
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
      )}
      {createPortal(
        <AnimatePresence>
          {isFocused && (
            <DeviceFocus
              key="focus"
              isPhone={isPhone}
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
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};
