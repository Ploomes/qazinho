import type { ISuiteTreeProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { Caret, Icon, IconButton } from '@/shared/components/atoms';
import { useSuiteTreeViewModel } from './hooks';
import './styles.css';

/**
 * Os testes de uma suíte por pasta e arquivo, cada um com como foi por último ou o passo
 * em que está, e uma run em todo nível.
 */
export const SuiteTree: React.FC<ISuiteTreeProps> = (props) => {
  const { foldTransition, stepTransition, folders } = useSuiteTreeViewModel(props);

  return (
    <div className="suite-tree">
      {folders.map((folder) => (
        <section key={folder.key} className="suite-tree__folder">
          <div className="suite-tree__folder-head">
            <button
              type="button"
              className="suite-tree__toggle"
              aria-expanded={folder.isOpen}
              onClick={folder.onToggle}
            >
              <Caret isOpen={folder.isOpen} />
              <span className="suite-tree__folder-icon">
                <Icon name="folder" />
              </span>
              <span className="suite-tree__folder-name">{folder.name}</span>
              <span className="suite-tree__count">{folder.count}</span>
            </button>
            <span className="suite-tree__tally">
              {folder.passed > 0 && (
                <span className="suite-tree__tally-item suite-tree__tally-item--pass">
                  <Icon name="passed" />
                  {folder.passed}
                </span>
              )}
              {folder.failed > 0 && (
                <span className="suite-tree__tally-item suite-tree__tally-item--fail">
                  <Icon name="failed" />
                  {folder.failed}
                </span>
              )}
            </span>
            {folder.canRun && (
              <span className="suite-tree__run">
                <IconButton
                  icon="play"
                  size="sm"
                  label={folder.runLabel}
                  onClick={folder.onRun}
                />
              </span>
            )}
          </div>

          <AnimatePresence initial={false}>
            {folder.isOpen && (
              <motion.div
                key="files"
                className="suite-tree__fold"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={foldTransition}
              >
                {folder.files.map((file) => (
                  <div key={file.key} className="suite-tree__file">
                    <div className="suite-tree__file-head">
                      <span className="suite-tree__file-icon">
                        <Icon name="file" />
                      </span>
                      <span className="suite-tree__file-name">{file.name}</span>
                      {folder.canRun && (
                        <span className="suite-tree__run">
                          <IconButton
                            icon="play"
                            size="sm"
                            label={file.runLabel}
                            onClick={file.onRun}
                          />
                        </span>
                      )}
                    </div>

                    <ul className="suite-tree__tests">
                      {file.tests.map((test) => (
                        <li key={test.key} className={test.className}>
                          <button
                            type="button"
                            className="suite-tree__pick"
                            aria-current={test.isPicked}
                            onClick={test.onPick}
                          >
                            <span className={test.stateClassName}>
                              <Icon name={test.icon} label={test.stateWord} />
                            </span>
                            <span className="suite-tree__line">
                              <span className="suite-tree__title" title={test.title}>
                                {test.title}
                              </span>
                              {test.project !== '' && (
                                <span className="suite-tree__project">
                                  {test.project}
                                </span>
                              )}
                              {test.tags.map((tag) => (
                                <span key={tag} className="suite-tree__tag">
                                  {tag}
                                </span>
                              ))}
                              <span className="suite-tree__duration">
                                {test.duration}
                              </span>
                            </span>
                          </button>
                          {folder.canRun && (
                            <span className="suite-tree__run">
                              <IconButton
                                icon="play"
                                size="sm"
                                label={test.runLabel}
                                onClick={test.onRun}
                              />
                            </span>
                          )}
                          <AnimatePresence initial={false}>
                            {test.step !== null && (
                              <motion.div
                                key="step"
                                className="suite-tree__step-fold"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={foldTransition}
                              >
                                <AnimatePresence initial={false}>
                                  <motion.span
                                    key={test.step}
                                    className="suite-tree__step"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={stepTransition}
                                  >
                                    {test.step}
                                  </motion.span>
                                </AnimatePresence>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      ))}
    </div>
  );
};
