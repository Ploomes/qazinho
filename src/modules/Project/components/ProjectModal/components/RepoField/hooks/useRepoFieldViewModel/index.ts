import type { IRepoFieldProps } from '@/modules/Project/components/ProjectModal/components/RepoField/types';
import type { ITargetLock } from '@/modules/Project/components/ProjectModal/components/TargetCard/types';
import type { IBranchList, IRepositoryList, IRepositoryRef } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GITHUB_FAILURE_KEYS } from '@/modules/Setup/constants';
import { useGithubConnect } from '@/modules/Setup/hooks';
import { Github } from '@/services';
import { useSetupStore } from '@/store';

export const useRepoFieldViewModel = (props: IRepoFieldProps) => {
  const { repositories, onChange } = props;
  const { t } = useTranslation();
  const isConnected = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'github'),
  );
  const github = useGithubConnect({ isOn: !isConnected });
  const [list, setList] = useState<IRepositoryList | null>(null);
  const [query, setQuery] = useState('');
  const [basing, setBasing] = useState<string | null>(null);
  const [branchQuery, setBranchQuery] = useState('');
  const [branches, setBranches] = useState<Record<string, IBranchList>>({});

  useEffect(() => {
    if (!isConnected) return;

    void Github.repositories().then(setList);
  }, [isConnected]);

  const keyOf = (repository: IRepositoryRef) => `${repository.owner}/${repository.name}`;
  const picked = repositories.map(keyOf);
  const known = list?.isListed === true ? list.repositories : [];
  const basingList = basing === null ? null : (branches[basing] ?? null);

  return {
    lock: isConnected
      ? null
      : ({
          reason: t('PROJECT.CODE_LOCKED'),
          setUp: { label: t('PROJECT.CODE_CONNECT'), onSetUp: github.onConnect },
        } satisfies ITargetLock),
    signIn: github.signIn,
    onCancelSignIn: github.onCancelSignIn,
    onCloseSignIn: github.onCloseSignIn,
    onRetrySignIn: github.onRetrySignIn,
    baseWord: t('PROJECT.CODE_BASE'),
    privateWord: t('PROJECT.CODE_PRIVATE'),
    rows: repositories.map((repository) => {
      const key = keyOf(repository);
      const isBasing = basing === key;

      return {
        key,
        base: repository.baseBranch,
        isPrivate: known.find((one) => keyOf(one) === key)?.isPrivate === true,
        isBasing,
        baseClassName: isBasing
          ? 'repo-field__base repo-field__base--open'
          : 'repo-field__base',
        baseLabel: t('PROJECT.CODE_BASE_LABEL', {
          repository: key,
          branch: repository.baseBranch,
        }),
        removeLabel: t('PROJECT.CODE_REMOVE', { repository: key }),
      };
    }),
    search: {
      query,
      label: t('PROJECT.CODE_SEARCH'),
      placeholder: t('PROJECT.CODE_SEARCH'),
      items: known
        .filter((repository) => !picked.includes(keyOf(repository)))
        .map((repository) => ({
          id: keyOf(repository),
          label: keyOf(repository),
          tag: repository.isPrivate ? t('PROJECT.CODE_PRIVATE') : null,
          detail: repository.description,
        })),
      note:
        list === null
          ? t('PROJECT.CODE_LOADING')
          : list.isListed
            ? null
            : t(GITHUB_FAILURE_KEYS[list.failure]),
      emptyText: t('PROJECT.CODE_NONE', { query: query.trim() }),
    },
    branchSearch: {
      query: branchQuery,
      label: t('PROJECT.BRANCH_SEARCH'),
      placeholder: t('PROJECT.BRANCH_SEARCH'),
      items:
        basingList?.isListed === true
          ? basingList.branches.map((branch) => ({
              id: branch.name,
              label: branch.name,
              tag: branch.isDefault ? t('PROJECT.BRANCH_DEFAULT') : null,
              detail:
                branch.pullRequest === null
                  ? null
                  : `#${String(branch.pullRequest.number)} ${branch.pullRequest.title}`,
            }))
          : [],
      note:
        basingList === null
          ? t('PROJECT.BRANCH_LOADING')
          : basingList.isListed
            ? null
            : t(GITHUB_FAILURE_KEYS[basingList.failure]),
      emptyText: t('PROJECT.BRANCH_NONE', { query: branchQuery.trim() }),
    },
    onQuery: setQuery,
    onAdd: (key: string) => {
      const repository = known.find((one) => keyOf(one) === key);

      if (repository === undefined || picked.includes(key)) return;

      onChange([
        ...repositories,
        {
          owner: repository.owner,
          name: repository.name,
          baseBranch: repository.defaultBranch,
        },
      ]);
      setQuery('');
    },
    onRemove: (key: string) => {
      onChange(repositories.filter((one) => keyOf(one) !== key));

      if (basing === key) setBasing(null);
    },
    onBase: (key: string) => {
      if (basing === key) {
        setBasing(null);

        return;
      }

      setBasing(key);
      setBranchQuery('');

      const repository = repositories.find((one) => keyOf(one) === key);

      if (repository === undefined || branches[key] !== undefined) return;

      void Github.branches({ owner: repository.owner, name: repository.name }).then(
        (found) => {
          setBranches((kept) => ({ ...kept, [key]: found }));
        },
      );
    },
    onBranchQuery: setBranchQuery,
    onPickBase: (branch: string) => {
      if (basing === null) return;

      onChange(
        repositories.map((one) =>
          keyOf(one) === basing ? { ...one, baseBranch: branch } : one,
        ),
      );
      setBasing(null);
    },
    onCloseBase: () => {
      setBasing(null);
    },
  };
};
