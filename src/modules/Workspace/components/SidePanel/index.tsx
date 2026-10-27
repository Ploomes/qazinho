import { AnimatePresence, motion } from 'motion/react';
import { Bugs } from '@/modules/Bug';
import { DeviceView } from '@/modules/Device';
import { Plan } from '@/modules/Plan';
import { Runs } from '@/modules/Run';
import { Icon, IconButton } from '@/shared/components/atoms';
import { Tooltip } from '@/shared/components/molecules';
import { MOTION } from '@/shared/constants';
import { PanelTabs } from './components';
import { useSidePanelViewModel } from './hooks';
import './styles.css';

/**
 * The panel beside the chat: the plan, the device, the runs or the bugs, on the tab the
 * QA picked, as wide as they dragged it, or widened over the chat.
 */
export const SidePanel: React.FC = () => {
  const {
    hasWorkspace,
    tab,
    isOpen,
    planCount,
    runCount,
    bugCount,
    isLive,
    railLabel,
    width,
    outerWidth,
    className,
    widthTransition,
    style,
    wideLabel,
    wideIcon,
    hideLabel,
    canResize,
    onSelectTab,
    onToggle,
    onWide,
    onResize,
    onResizeStart,
    onResizeEnd,
  } = useSidePanelViewModel();

  if (!hasWorkspace) return null;

  return (
    <motion.aside
      className={className}
      style={style}
      initial={false}
      animate={{ width: outerWidth }}
      transition={widthTransition}
    >
      <AnimatePresence initial={false}>
        {!isOpen && (
          <motion.button
            key="rail"
            type="button"
            className="side-panel__rail"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: MOTION.duration, delay: 0.08 },
            }}
            exit={{ opacity: 0, transition: { duration: MOTION.durationFast } }}
            onClick={onToggle}
          >
            <span className="side-panel__mirror">
              <Icon name="sidebar" />
            </span>
            <span>{railLabel}</span>
          </motion.button>
        )}

        {isOpen && (
          <motion.div
            key="panel"
            className="side-panel__open"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: MOTION.duration, delay: 0.08 },
            }}
            exit={{ opacity: 0, transition: { duration: MOTION.durationFast } }}
          >
            {canResize ? (
              <motion.div
                className="side-panel__handle"
                drag="x"
                dragMomentum={false}
                dragElastic={0}
                dragConstraints={{ left: 0, right: 0 }}
                onDragStart={onResizeStart}
                onDragEnd={onResizeEnd}
                onDrag={(_, info) => {
                  onResize(width - info.delta.x);
                }}
              />
            ) : (
              <div className="side-panel__handle side-panel__handle--still" />
            )}

            <div className="side-panel__inner">
              <header className="side-panel__header">
                <PanelTabs
                  current={tab}
                  planCount={planCount}
                  runCount={runCount}
                  bugCount={bugCount}
                  isLive={isLive}
                  onSelect={onSelectTab}
                />
                <span className="side-panel__tools">
                  <Tooltip content={wideLabel}>
                    <IconButton
                      icon={wideIcon}
                      label={wideLabel}
                      size="sm"
                      onClick={onWide}
                    />
                  </Tooltip>
                  <Tooltip content={hideLabel}>
                    <span className="side-panel__mirror">
                      <IconButton
                        icon="sidebar"
                        label={hideLabel}
                        size="sm"
                        onClick={onToggle}
                      />
                    </span>
                  </Tooltip>
                </span>
              </header>

              {tab === 'device' ? (
                <DeviceView />
              ) : (
                <div className="side-panel__scroll">
                  {tab === 'plan' && <Plan />}
                  {tab === 'runs' && <Runs />}
                  {tab === 'bugs' && <Bugs />}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};
