import type { IDeviceFocusProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { DeviceScreen } from '@/modules/Device/components/DeviceView/components/DeviceScreen';
import { LiveClock } from '@/modules/Device/components/DeviceView/components/LiveClock';
import { ScreenRail } from '@/modules/Device/components/DeviceView/components/ScreenRail';
import { ViewportPicker } from '@/modules/Device/components/DeviceView/components/ViewportPicker';
import { DEVICE } from '@/modules/Device/constants';
import { Button, Eyebrow, Intern, Kbd, StatusPill } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useDeviceFocusViewModel } from './hooks';
import './styles.css';

/**
 * O dispositivo enchendo o app enquanto o agente o dirige, com a run ao lado; o Esc o
 * devolve.
 */
export const DeviceFocus: React.FC<IDeviceFocusProps> = (props) => {
  const {
    style,
    nowEyebrow,
    now,
    nowNumber,
    sections,
    stepsRef,
    onStepsScroll,
    hasViewports,
    hasRail,
    frameClassName,
  } = useDeviceFocusViewModel(props);
  const { t } = useTranslation();

  return (
    <motion.div
      className="device-focus"
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
    >
      <div className="device-focus__stage">
        {hasRail && (
          <ScreenRail
            label={props.railLabel}
            screens={props.screens}
            onPick={props.onPickScreen}
          />
        )}

        <div className="device-focus__frame">
          <motion.div
            layoutId={DEVICE.frameLayoutId}
            className={frameClassName}
            transition={{ duration: MOTION.durationSlow, ease: MOTION.ease }}
          >
            {!props.isPhone && (
              <div className="device-focus__chrome">
                <span className="device-focus__dot" />
                <span className="device-focus__dot" />
                <span className="device-focus__dot" />
                <span className="device-focus__url">{props.urlText}</span>
              </div>
            )}
            <motion.div className="device-focus__swap" animate={props.swap}>
              <DeviceScreen shot={props.shot} stream={props.stream} ratio={props.ratio} />
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.aside
        className="device-focus__side"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        transition={{ duration: MOTION.duration, ease: MOTION.ease }}
      >
        <div className="device-focus__top">
          <span className="device-focus__state">
            <Intern mood={props.mood} size={26} isStill />
            {props.stateText}
          </span>
          {props.pickedNotice !== null && (
            <button
              type="button"
              className="device-focus__follow"
              onClick={props.onFollowAgent}
            >
              {props.pickedNotice}
            </button>
          )}
          <Button size="sm" variant="ghost" onClick={props.onClose}>
            {t('DEVICE.FOCUS_LEAVE')}
            <Kbd combo="Esc" />
          </Button>
        </div>

        <div className="device-focus__now">
          <span className="device-focus__now-head">
            <Eyebrow>{nowEyebrow}</Eyebrow>
            {props.isLive && <LiveClock label={props.elapsedLabel} />}
          </span>
          <p className="device-focus__now-text">
            {nowNumber !== null && (
              <span className="device-focus__now-number">{nowNumber}</span>
            )}
            {now}
          </p>
          <AnimatePresence mode="wait" initial={false}>
            {props.doingNow !== null && (
              <motion.p
                key={props.doingNow.id}
                className="device-focus__doing"
                title={props.doingNow.text}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
              >
                {props.doingNow.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {hasViewports && (
          <ViewportPicker viewports={props.viewports} onSelect={props.onSelectViewport} />
        )}

        {props.hasControls && (
          <div className="device-focus__controls">
            <Button size="sm" onClick={props.onPause}>
              {props.pauseLabel}
            </Button>
            <Button size="sm" variant="danger" onClick={props.onStop}>
              {t('COMMON.STOP')}
            </Button>
          </div>
        )}

        <div className="device-focus__list">
          <Eyebrow>
            {props.stepsWord} {props.doingLabel}
          </Eyebrow>
          <div ref={stepsRef} className="device-focus__steps" onScroll={onStepsScroll}>
            {sections.map((section) => (
              <div key={section.key} className="device-focus__section">
                {section.title !== '' && (
                  <span className="device-focus__case">{section.title}</span>
                )}
                {section.rows.map((row) => (
                  <div
                    key={row.number}
                    className={
                      row.isCurrent
                        ? 'device-focus__step device-focus__step--current'
                        : 'device-focus__step'
                    }
                  >
                    <StatusPill status={row.verdict} label="" />
                    <span>{row.action}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </motion.aside>
    </motion.div>
  );
};
