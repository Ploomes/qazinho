import { AnimatePresence, motion } from 'motion/react';
import { Button, Icon, Intern } from '@/shared/components/atoms';
import { STICKER } from '@/shared/constants';
import { useUpdateRequiredViewModel } from './hooks/useUpdateRequiredViewModel';
import './styles.css';

/** A tela de quem está logado numa versão que a API recusa: só resta atualizar. */
export const UpdateRequired: React.FC = () => {
  const view = useUpdateRequiredViewModel();

  return (
    <section className="update-required">
      <Intern mood={view.mood} size={112} />
      <h1 className="update-required__title">{view.title}</h1>
      <p className="update-required__body">{view.body}</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view.stateKey}
          className="update-required__state"
          initial={STICKER.slap.initial}
          animate={STICKER.slap.animate}
          exit={STICKER.slap.exit}
        >
          {view.isWorking && (
            <>
              <div
                className="update-required__bar"
                role="progressbar"
                aria-valuenow={view.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={view.workingLabel}
              >
                <span className="update-required__fill" style={view.barStyle} />
              </div>
              <p className="update-required__note">{view.workingLabel}</p>
            </>
          )}
          {view.isReady && (
            <Button variant="primary" onClick={view.onRestart}>
              <Icon name="reload" />
              {view.restartLabel}
            </Button>
          )}
          {view.isStore && (
            <>
              <p className="update-required__note">{view.storeLabel}</p>
              <Button variant="primary" onClick={view.onOpenStore}>
                {view.openStoreLabel}
                <Icon name="external" />
              </Button>
            </>
          )}
          {view.isFailed && (
            <>
              <p className="update-required__note">{view.failedLabel}</p>
              <Button onClick={view.onDownload}>
                {view.downloadLabel}
                <Icon name="external" />
              </Button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};
