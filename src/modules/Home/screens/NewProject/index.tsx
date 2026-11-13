import { AnimatePresence, motion } from 'motion/react';
import { FillStep, NothingStep, PickStep } from './components';
import { STEP_SLIDE } from './constants';
import { useNewProjectViewModel } from './hooks';
import './styles.css';

/**
 * Criar um projeto pelo que o QA já tem: marca os cartões, preenche só o que marcou, e
 * cai no projeto novo com o primeiro plano começando.
 */
export const NewProject: React.FC = () => {
  const view = useNewProjectViewModel();

  return (
    <section className="new-project" style={view.style}>
      <div className="new-project__column">
        <AnimatePresence mode="wait" custom={view.direction} initial={false}>
          <motion.div
            key={view.stepKey}
            className="new-project__step"
            custom={view.direction}
            variants={STEP_SLIDE}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <header className="new-project__head">
              <h1 className="new-project__title">{view.title}</h1>
              <p className="new-project__lead">{view.lead}</p>
            </header>
            {view.isPick && <PickStep {...view.pick} />}
            {view.isFill && <FillStep {...view.fill} />}
            {view.isNothingStep && <NothingStep {...view.nothing} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};
