import type { IBuildFromCodeProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { BuildProgress } from '@/modules/Build';
import { Button, Icon } from '@/shared/components/atoms';
import { SearchList } from '@/shared/components/molecules';
import { MOTION } from '@/shared/constants';
import { useBuildFromCodeViewModel } from './hooks';
import './styles.css';

/**
 * A platform of a project built from one of its repositories by the QA's agent: pick a
 * branch, then follow the build.
 */
export const BuildFromCode: React.FC<IBuildFromCodeProps> = (props) => {
  const {
    isBuilding,
    buildId,
    isPicking,
    openLabel,
    startLabel,
    cancelLabel,
    repositoryLabel,
    repositories,
    branchLabel,
    query,
    searchLabel,
    rows,
    note,
    emptyText,
    canStart,
    onOpen,
    onCancel,
    onQuery,
    onPickBranch,
    onStart,
    onReset,
  } = useBuildFromCodeViewModel(props);

  return (
    <div className="build-from-code">
      <AnimatePresence initial={false} mode="wait">
        {isBuilding && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <BuildProgress buildId={buildId} onRetry={onReset} />
          </motion.div>
        )}

        {!isBuilding && isPicking && (
          <motion.div
            key="pick"
            className="build-from-code__fold"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: MOTION.duration, ease: MOTION.ease }}
          >
            <div className="build-from-code__pick">
              {repositories.length > 0 && (
                <div
                  className="build-from-code__repositories"
                  aria-label={repositoryLabel}
                >
                  {repositories.map((repository) => (
                    <button
                      key={repository.key}
                      type="button"
                      className={repository.className}
                      onClick={repository.onPick}
                    >
                      {repository.label}
                    </button>
                  ))}
                </div>
              )}
              <span className="build-from-code__branch">{branchLabel}</span>
              <SearchList
                query={query}
                label={searchLabel}
                placeholder={searchLabel}
                items={rows}
                note={note}
                emptyText={emptyText}
                onQuery={onQuery}
                onPick={onPickBranch}
              />
              <div className="build-from-code__actions">
                <Button size="sm" variant="ghost" onClick={onCancel}>
                  {cancelLabel}
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!canStart}
                  onClick={onStart}
                >
                  {startLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {!isBuilding && !isPicking && (
          <motion.span
            key="open"
            className="build-from-code__open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
          >
            <Button size="sm" variant="secondary" onClick={onOpen}>
              <Icon name="sparkle" /> {openLabel}
            </Button>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
