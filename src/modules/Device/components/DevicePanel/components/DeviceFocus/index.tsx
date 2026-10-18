import type { IDeviceFocusProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { DeviceScreen } from '@/modules/Device/components/DevicePanel/components/DeviceScreen';
import { LiveClock } from '@/modules/Device/components/DevicePanel/components/LiveClock';
import { DEVICE } from '@/modules/Device/constants';
import { Button, Eyebrow, Intern, Kbd, StatusPill } from '@/shared/components/atoms';
import { MOTION } from '@/shared/constants';
import { useDeviceFocusViewModel } from './hooks';
import './styles.css';

/** The device filling the app while the agent drives it, with the run beside it; Esc puts it back. */
export const DeviceFocus: React.FC<IDeviceFocusProps> = (props) => {
  const { style, nowEyebrow, now, nowNumber, rows } = useDeviceFocusViewModel(props);
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
        <motion.div
          layoutId={DEVICE.frameLayoutId}
          className={props.isPhone ? 'device-focus__phone' : 'device-focus__browser'}
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
          <DeviceScreen shot={props.shot} stream={props.stream} ratio={props.ratio} />
        </motion.div>
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
            {props.isLive && <LiveClock label={props.elapsedLabel} />}
          </span>
          <Button size="sm" variant="ghost" onClick={props.onClose}>
            {t('DEVICE.FOCUS_LEAVE')}
            <Kbd combo="Esc" />
          </Button>
        </div>

        <div className="device-focus__now">
          <Eyebrow>{nowEyebrow}</Eyebrow>
          <p className="device-focus__now-text">
            {nowNumber !== null && (
              <span className="device-focus__now-number">{nowNumber}</span>
            )}
            {now}
          </p>
        </div>

        {props.viewports.length > 0 && (
          <div className="device-focus__viewports">
            <Eyebrow>{t('DEVICE.VIEWPORT')}</Eyebrow>
            <div className="device-focus__viewport-list" role="radiogroup">
              {props.viewports.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={option.isActive}
                  className={
                    option.isActive
                      ? 'device-focus__viewport device-focus__viewport--on'
                      : 'device-focus__viewport'
                  }
                  onClick={() => {
                    props.onSelectViewport(option.id);
                  }}
                >
                  {option.isActive && (
                    <motion.span
                      layoutId={DEVICE.viewportLayoutId}
                      className="device-focus__viewport-mark"
                      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                    />
                  )}
                  <span className="device-focus__viewport-label">{option.label}</span>
                  <span className="device-focus__viewport-size">{option.size}</span>
                </button>
              ))}
            </div>
            <AnimatePresence initial={false}>
              {props.viewportNote !== '' && (
                <motion.p
                  key="next"
                  className="device-focus__viewport-note"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                >
                  {props.viewportNote}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
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

        <div className="device-focus__steps">
          <Eyebrow>
            {t('DEVICE.STEPS')} {props.doingLabel}
          </Eyebrow>
          {rows.map((row) => (
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
      </motion.aside>
    </motion.div>
  );
};
