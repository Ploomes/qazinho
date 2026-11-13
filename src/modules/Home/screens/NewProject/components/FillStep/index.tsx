import type { IFillStepProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { BuildField } from '@/modules/Home/screens/NewProject/components/BuildField';
import { DesignField } from '@/modules/Home/screens/NewProject/components/DesignField';
import { StoryField } from '@/modules/Home/screens/NewProject/components/StoryField';
import { TestsField } from '@/modules/Home/screens/NewProject/components/TestsField';
import { WebField } from '@/modules/Home/screens/NewProject/components/WebField';
import { RepoField } from '@/modules/Project';
import { Button } from '@/shared/components/atoms';
import { MOTION, STICKER } from '@/shared/constants';
import './styles.css';

/** Um campo por cartão marcado, e o botão de criar. */
export const FillStep: React.FC<IFillStepProps> = (props) => (
  <div className="fill-step">
    <div className="fill-step__fields">
      {props.fields.map((field) => (
        <motion.div
          key={field.key}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: field.delay,
            duration: MOTION.durationSlow,
            ease: MOTION.ease,
          }}
        >
          {field.isWeb && <WebField value={props.web} onChange={props.onWeb} />}
          {field.isBuild && <BuildField value={props.builds} onChange={props.onBuilds} />}
          {field.isCode && (
            <div className="fill-step__code">
              <RepoField
                repositories={props.repositories}
                onChange={props.onRepositories}
              />
            </div>
          )}
          {field.isTests && <TestsField value={props.tests} onChange={props.onTests} />}
          {field.isStory && <StoryField value={props.story} onChange={props.onStory} />}
          {field.isDesign && (
            <DesignField value={props.design} onChange={props.onDesign} />
          )}
        </motion.div>
      ))}
    </div>

    <div className="new-project__foot">
      <AnimatePresence mode="wait" initial={false}>
        {props.hasMissing && (
          <motion.span
            key={props.missingText}
            className="new-project__count"
            initial={STICKER.rise.initial}
            animate={STICKER.rise.animate}
            exit={STICKER.rise.exit}
          >
            {props.missingText}
          </motion.span>
        )}
      </AnimatePresence>
      <div className="new-project__actions">
        <Button variant="ghost" onClick={props.onBack}>
          {props.backLabel}
        </Button>
        <Button variant="primary" disabled={!props.canCreate} onClick={props.onCreate}>
          {props.createLabel}
        </Button>
      </div>
    </div>
  </div>
);
