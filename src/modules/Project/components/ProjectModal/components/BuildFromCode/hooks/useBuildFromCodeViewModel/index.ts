import type { IBuildFromCodeProps } from '@/modules/Project/components/ProjectModal/components/BuildFromCode/types';
import type { IProjectRepository } from '@/modules/Project/types';
import type { IBranchList } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBuildActions } from '@/modules/Build';
import { matchesQuery } from '@/modules/Chat';
import { GITHUB_FAILURE_KEYS } from '@/modules/Setup';
import { Github } from '@/services';

export const useBuildFromCodeViewModel = (props: IBuildFromCodeProps) => {
  const { platform, projectId, repositories, buildId } = props;
  const { t } = useTranslation();
  const { startBuild } = useBuildActions();
  const [isPicking, setPicking] = useState(false);
  const [chosenKey, setChosenKey] = useState<string | null>(null);
  const [branch, setBranch] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [lists, setLists] = useState<Record<string, IBranchList>>({});

  const keyOf = (one: IProjectRepository) => `${one.owner}/${one.name}`;
  const repository =
    repositories.find((one) => keyOf(one) === chosenKey) ?? repositories[0] ?? null;
  const list = repository === null ? null : (lists[keyOf(repository)] ?? null);
  const chosenBranch = branch ?? repository?.baseBranch ?? '';

  const load = (one: IProjectRepository) => {
    const key = keyOf(one);

    if (lists[key] !== undefined) return;

    void Github.branches({ owner: one.owner, name: one.name }).then((listed) => {
      setLists((all) => ({ ...all, [key]: listed }));
    });
  };

  return {
    isBuilding: buildId !== null,
    buildId: buildId ?? '',
    isPicking,
    openLabel: t('BUILD.FROM_CODE'),
    startLabel: t(
      platform === 'android' ? 'BUILD.FROM_CODE_ANDROID' : 'BUILD.FROM_CODE_IOS',
    ),
    cancelLabel: t('COMMON.CANCEL'),
    repositoryLabel: t('BUILD.PICK_REPOSITORY'),
    repositories:
      repositories.length < 2
        ? []
        : repositories.map((one) => ({
            key: keyOf(one),
            label: keyOf(one),
            className:
              keyOf(one) === (repository === null ? null : keyOf(repository))
                ? 'build-from-code__repository build-from-code__repository--chosen'
                : 'build-from-code__repository',
            onPick: () => {
              setChosenKey(keyOf(one));
              setBranch(null);
              setQuery('');
              load(one);
            },
          })),
    branchLabel: t('BUILD.BRANCH_CHOSEN', { branch: chosenBranch }),
    query,
    searchLabel: t('PROJECT.BRANCH_SEARCH'),
    rows:
      list?.isListed === true
        ? list.branches
            .filter((one) =>
              matchesQuery({
                text: `${one.name} ${one.pullRequest?.title ?? ''}`,
                query,
              }),
            )
            .map((one) => ({
              id: one.name,
              label: one.name,
              tag: one.name === repository?.baseBranch ? t('PROJECT.CODE_BASE') : null,
              detail:
                one.pullRequest === null
                  ? null
                  : `#${String(one.pullRequest.number)} ${one.pullRequest.title}`,
            }))
        : [],
    note:
      list === null
        ? t('PROJECT.BRANCH_LOADING')
        : list.isListed
          ? null
          : t(GITHUB_FAILURE_KEYS[list.failure]),
    emptyText: t('PROJECT.BRANCH_NONE', { query }),
    canStart: repository !== null && chosenBranch !== '',
    onOpen: () => {
      setPicking(true);

      if (repository !== null) load(repository);
    },
    onCancel: () => {
      setPicking(false);
      setQuery('');
    },
    onQuery: setQuery,
    onPickBranch: (name: string) => {
      setBranch(name);
      setQuery('');
    },
    onStart: () => {
      if (repository === null || chosenBranch === '') return;

      const id = startBuild({
        projectId,
        platform,
        repository: { owner: repository.owner, name: repository.name },
        branch: chosenBranch,
      });

      setPicking(false);
      props.onStart(id);
    },
    onReset: props.onReset,
  };
};
