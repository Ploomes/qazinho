import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon } from '@/shared/components/atoms';
import { SegmentedControl } from '@/shared/components/molecules';
import { STICKER } from '@/shared/constants';
import { UsageBar } from './components';
import { useStorageSettingsViewModel } from './hooks';
import './styles.css';

/**
 * O que o QAzinho guarda neste computador, por tipo, e por quanto tempo guarda os vídeos
 * de run antes de soltá-los.
 */
export const StorageSettings: React.FC = () => {
  const view = useStorageSettingsViewModel();

  return (
    <div className="storage-settings">
      <section className="settings__section" aria-busy={view.isLoading}>
        <motion.div
          className={
            view.isRefreshing
              ? 'storage-settings__usage storage-settings__usage--busy'
              : 'storage-settings__usage'
          }
          variants={view.stackMotion}
          initial="hidden"
          animate="shown"
        >
          {view.hero === null ? (
            <div
              className="storage-settings__hero"
              role="status"
              aria-label={view.measuringLabel}
            >
              <span className="storage-settings__bone storage-settings__bone--value" />
              <span className="storage-settings__bone storage-settings__bone--caption" />
            </div>
          ) : (
            <motion.figure
              key="hero"
              className="storage-settings__hero"
              variants={view.itemMotion}
              initial="hidden"
              animate="shown"
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  key={`${view.hero.value}${view.hero.unit}`}
                  className="storage-settings__figure"
                  initial={STICKER.rise.initial}
                  animate={STICKER.rise.animate}
                  exit={STICKER.rise.exit}
                >
                  <span className="storage-settings__value">{view.hero.value}</span>
                  <span className="storage-settings__unit">{view.hero.unit}</span>
                </motion.span>
              </AnimatePresence>
              <figcaption className="storage-settings__caption">
                {view.caption}
              </figcaption>
            </motion.figure>
          )}

          <UsageBar
            rows={view.rows}
            segments={view.segments}
            isPending={view.isLoading}
            isEmpty={view.isEmpty}
            barMotion={view.barMotion}
            itemMotion={view.itemMotion}
            growth={view.growth}
            onActivate={view.onActivate}
            onDeactivate={view.onDeactivate}
          />
        </motion.div>
      </section>

      <section className="settings__section">
        <span className="settings__eyebrow">{view.keepLabel}</span>
        <SegmentedControl
          label={view.keepLabel}
          options={view.keepOptions}
          value={view.keepValue}
          onChange={view.onKeepChange}
        />

        <div className="storage-settings__rule">
          <AnimatePresence initial={false} mode="wait">
            <motion.p
              key={view.ruleKey}
              className="storage-settings__rule-text"
              initial={STICKER.rise.initial}
              animate={STICKER.rise.animate}
              exit={STICKER.rise.exit}
            >
              {view.rule}
            </motion.p>
          </AnimatePresence>
          <p className="settings__note">{view.keepNote}</p>
        </div>

        <div className="storage-settings__sweep">
          <Button size="sm" onClick={view.onSweep} disabled={!view.canSweep}>
            {view.isSweeping && (
              <span className="storage-settings__spin">
                <Icon name="reload" />
              </span>
            )}
            {view.sweepLabel}
          </Button>
          <AnimatePresence initial={false}>
            {view.sweptLine !== null && view.sweptIcon !== null && (
              <motion.span
                key="swept"
                className={`storage-settings__swept storage-settings__swept--${String(view.sweptTone)}`}
                role="status"
                initial={STICKER.slap.initial}
                animate={STICKER.slap.animate}
                exit={STICKER.slap.exit}
              >
                <Icon name={view.sweptIcon} />
                {view.sweptLine}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};
