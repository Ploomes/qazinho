import type { IRepoFieldProps } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { TargetCard } from '@/modules/Project/components/TargetCard';
import { GithubSignIn } from '@/modules/Setup';
import { IconButton } from '@/shared/components/atoms';
import { SearchList } from '@/shared/components/molecules';
import { MOTION } from '@/shared/constants';
import { useRepoFieldViewModel } from './hooks';
import './styles.css';

/**
 * Os repositórios do GitHub de que um projeto é feito, cada um com a branch contra a qual
 * as mudanças dele são medidas.
 */
export const RepoField: React.FC<IRepoFieldProps> = (props) => {
  const {
    lock,
    signIn,
    onCancelSignIn,
    onCloseSignIn,
    onRetrySignIn,
    baseWord,
    privateWord,
    rows,
    search,
    branchSearch,
    onQuery,
    onAdd,
    onRemove,
    onBase,
    onBranchQuery,
    onPickBase,
    onCloseBase,
  } = useRepoFieldViewModel(props);
  const { t } = useTranslation();

  return (
    <>
      <TargetCard name={t('PROJECT.CODE_NAME')} lock={lock} isStacked>
        <div className="repo-field">
          <AnimatePresence initial={false}>
            {rows.map((row) => (
              <motion.div
                key={row.key}
                className="repo-field__fold"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: MOTION.duration, ease: MOTION.ease }}
              >
                <div className="repo-field__row">
                  <span className="repo-field__name">{row.key}</span>
                  {row.isPrivate && (
                    <span className="repo-field__tag">{privateWord}</span>
                  )}
                  <button
                    type="button"
                    className={row.baseClassName}
                    aria-expanded={row.isBasing}
                    aria-label={row.baseLabel}
                    onClick={() => {
                      onBase(row.key);
                    }}
                  >
                    <span className="repo-field__base-word">{baseWord}</span>
                    <span className="repo-field__base-name">{row.base}</span>
                    <span className="repo-field__chevron" aria-hidden="true" />
                  </button>
                  <IconButton
                    icon="close"
                    size="sm"
                    label={row.removeLabel}
                    onClick={() => {
                      onRemove(row.key);
                    }}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {row.isBasing && (
                    <motion.div
                      key="base"
                      className="repo-field__fold"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: MOTION.duration, ease: MOTION.ease }}
                    >
                      <div className="repo-field__base-pick">
                        <SearchList
                          {...branchSearch}
                          isOpen
                          isAutoFocused
                          onQuery={onBranchQuery}
                          onPick={onPickBase}
                          onEscape={onCloseBase}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          <SearchList {...search} onQuery={onQuery} onPick={onAdd} />
        </div>
      </TargetCard>

      <AnimatePresence>
        {signIn !== null && (
          <GithubSignIn
            key="github-sign-in"
            progress={signIn}
            onCancel={onCancelSignIn}
            onClose={onCloseSignIn}
            onRetry={onRetrySignIn}
          />
        )}
      </AnimatePresence>
    </>
  );
};
