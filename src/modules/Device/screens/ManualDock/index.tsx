import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon, Input, Intern, StatusPill } from '@/shared/components/atoms';
import { Fold } from '@/shared/components/molecules';
import { STICKER } from '@/shared/constants';
import { useManualDockViewModel } from './hooks';
import './styles.css';

/**
 * A janela do QAzinho encostada ao lado do Chrome de um caso à mão: o passo, o que se
 * espera e as marcas, enquanto o QA usa o navegador de verdade.
 */
export const ManualDock: React.FC = () => {
  const view = useManualDockViewModel();

  return (
    <section className="manual-dock" aria-label={view.caseTitle}>
      <header className={view.barClassName}>
        <span className="manual-dock__crumb">
          <span className="manual-dock__project">{view.projectName}</span>
          <span className="manual-dock__slash">/</span>
          <span className="manual-dock__plan">{view.planName}</span>
        </span>
      </header>

      <div className="manual-dock__body">
        <div className="manual-dock__status">
          <Intern mood={view.mood} size={view.internSize} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={view.phase}
              className="manual-dock__state"
              initial={STICKER.rise.initial}
              animate={STICKER.rise.animate}
              exit={STICKER.rise.exit}
            >
              {view.stateLabel}
            </motion.span>
          </AnimatePresence>
          <span className="manual-dock__time">{view.elapsedLabel}</span>
        </div>

        <div className="manual-dock__meter">
          <div
            className="manual-dock__progress"
            role="progressbar"
            aria-valuenow={view.progressValue}
            aria-valuemin={0}
            aria-valuemax={view.progressMax}
            aria-label={view.progressLabel}
          >
            <span className="manual-dock__fill" style={view.progressStyle} />
          </div>
          <span className="manual-dock__count">{view.progressLabel}</span>
        </div>

        <div className="manual-dock__case">
          <span className="manual-dock__id">{view.caseId}</span>
          <h1 className="manual-dock__title">{view.caseTitle}</h1>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={view.line}
              className="manual-dock__line"
              initial={STICKER.rise.initial}
              animate={STICKER.rise.animate}
              exit={STICKER.rise.exit}
            >
              {view.line}
            </motion.p>
          </AnimatePresence>
        </div>

        <ol className="manual-dock__steps">
          {view.steps.map((step) => (
            <motion.li key={step.key} layout className={step.className}>
              {step.isNow && (
                <motion.span
                  layoutId="manual-dock-now"
                  className="manual-dock__now"
                  transition={STICKER.spring}
                />
              )}
              <span className="manual-dock__mark">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={step.status}
                    className="manual-dock__icon"
                    initial={STICKER.hero.initial}
                    animate={STICKER.hero.animate}
                    exit={STICKER.hero.exit}
                  >
                    <StatusPill status={step.status} label="" />
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="manual-dock__step-body">
                <span className="manual-dock__action">{step.action}</span>
                <AnimatePresence initial={false}>
                  {step.isNow && step.expected !== '' && (
                    <Fold key="expected" className="manual-dock__fold">
                      <span className="manual-dock__expected">
                        <span className="manual-dock__prefix">{view.expectedPrefix}</span>{' '}
                        {step.expected}
                      </span>
                    </Fold>
                  )}
                </AnimatePresence>
              </span>
            </motion.li>
          ))}
        </ol>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {view.isTurn && (
          <motion.footer
            key="turn"
            className="manual-dock__foot"
            initial={STICKER.rise.initial}
            animate={STICKER.rise.animate}
            exit={STICKER.rise.exit}
          >
            <Input
              label={view.notePlaceholder}
              placeholder={view.notePlaceholder}
              value={view.note}
              onChange={view.onNote}
            />
            <div className="manual-dock__marks">
              <Button variant="primary" disabled={!view.canMark} onClick={view.onPassed}>
                <Icon name="check" />
                {view.passedLabel}
              </Button>
              <Button
                variant="secondary"
                disabled={!view.canMark}
                onClick={view.onFailed}
              >
                <Icon name="close" />
                {view.failedLabel}
              </Button>
              <Button variant="ghost" disabled={!view.canMark} onClick={view.onSkip}>
                {view.skipLabel}
              </Button>
            </div>
            {view.hasVariables && (
              <div className="manual-dock__variables">
                <Button size="sm" variant="ghost" onClick={view.onPickVariable}>
                  {view.variableLabel}
                </Button>
                <AnimatePresence initial={false}>
                  {view.isPicking && (
                    <Fold key="names" className="manual-dock__fold">
                      <span className="manual-dock__names">
                        {view.variables.map((variable) => (
                          <button
                            key={variable.name}
                            type="button"
                            className="manual-dock__name"
                            onClick={variable.onPick}
                          >
                            {variable.name}
                          </button>
                        ))}
                      </span>
                    </Fold>
                  )}
                </AnimatePresence>
              </div>
            )}
            <div className="manual-dock__end">
              <Button size="sm" variant="ghost" onClick={view.onEnd}>
                {view.endLabel}
              </Button>
              <span className="manual-dock__keys">
                <kbd className="manual-dock__kbd">{view.passedKeys}</kbd>
                {view.passedKeysLabel}
                <kbd className="manual-dock__kbd">{view.failedKeys}</kbd>
                {view.failedKeysLabel}
              </span>
            </div>
          </motion.footer>
        )}
        {view.isPreparing && (
          <motion.footer
            key="preparing"
            className="manual-dock__foot"
            initial={STICKER.rise.initial}
            animate={STICKER.rise.animate}
            exit={STICKER.rise.exit}
          >
            <div className="manual-dock__end">
              <Button size="sm" variant="ghost" onClick={view.onStop}>
                {view.stopLabel}
              </Button>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </section>
  );
};
