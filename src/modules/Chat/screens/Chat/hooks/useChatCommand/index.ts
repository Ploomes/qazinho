import type {
  ChatCommandId,
  ICommandDraft,
  ICommandPicker,
  ICommandRow,
  IComposerCommand,
  IUserCommand,
} from '@/modules/Chat/types';
import type { IProjectRepository } from '@/modules/Project/types';
import type { IBranch, IBranchList, ICodeAsk } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { matchesQuery } from '@/modules/Chat/library';
import { CHAT_COMMANDS } from '@/modules/Chat/screens/Chat/constants';
import { GITHUB_FAILURE_KEYS } from '@/modules/Setup';
import { Github } from '@/services';

export const useChatCommand = (props: {
  draft: string;
  repositories: IProjectRepository[];
  isGithubConnected: boolean;
  onDraft: (draft: string) => void;
}) => {
  const { draft, repositories, isGithubConnected, onDraft } = props;
  const { t } = useTranslation();
  const [command, setCommand] = useState<ICommandDraft | null>(null);
  const [branchLists, setBranchLists] = useState<Record<string, IBranchList>>({});

  const keyOf = (repository: IProjectRepository) =>
    `${repository.owner}/${repository.name}`;
  const slash = command === null && /^\/\S*$/.test(draft) ? draft.slice(1) : null;
  const step =
    command === null
      ? slash === null
        ? null
        : 'command'
      : command.repository === null
        ? 'repository'
        : command.branch === null
          ? 'branch'
          : 'ready';
  const blocker = !isGithubConnected
    ? t('COMMANDS.NEEDS_GITHUB')
    : repositories.length === 0
      ? t('COMMANDS.NEEDS_REPOSITORIES')
      : null;
  const repository = command?.repository ?? null;
  const base = repository?.baseBranch ?? '';
  const branchList =
    repository === null ? null : (branchLists[keyOf(repository)] ?? null);

  const load = (picked: IProjectRepository) => {
    if (branchLists[keyOf(picked)] !== undefined) return;

    void Github.branches({ owner: picked.owner, name: picked.name }).then((list) => {
      setBranchLists((kept) => ({ ...kept, [keyOf(picked)]: list }));
    });
  };

  const start = (id: ChatCommandId) => {
    const only = repositories.length === 1 ? (repositories[0] ?? null) : null;

    setCommand({ id, repository: only, branch: null });
    if (only !== null) load(only);
    onDraft('');
  };

  const commandRows: ICommandRow[] = CHAT_COMMANDS.filter((one) =>
    matchesQuery({
      text: `${one.slug} ${t(one.labelKey)} ${one.aliases}`,
      query: slash ?? '',
    }),
  ).map((one) => ({
    id: one.id,
    label: t(one.labelKey),
    tag: one.slug,
    detail: blocker ?? t(one.textKey),
    isDisabled: blocker !== null,
  }));

  const repositoryRows: ICommandRow[] = repositories
    .filter((one) => matchesQuery({ text: keyOf(one), query: draft }))
    .map((one) => ({
      id: keyOf(one),
      label: keyOf(one),
      tag: null,
      detail: t('COMMANDS.BASE', { branch: one.baseBranch }),
      isDisabled: false,
    }));

  const listed: IBranch[] = branchList?.isListed === true ? branchList.branches : [];
  const branches: IBranch[] = [
    ...listed.filter(({ name }) => name === base),
    ...(listed.some(({ name }) => name === base) || base === ''
      ? []
      : [{ name: base, isDefault: false, pullRequest: null, movedAt: null }]),
    ...listed.filter(({ name }) => name !== base),
  ];
  const branchRows: ICommandRow[] =
    branchList?.isListed === true
      ? branches
          .filter((branch) =>
            matchesQuery({
              text: `${branch.name} ${branch.pullRequest?.title ?? ''}`,
              query: draft,
            }),
          )
          .map((branch) => ({
            id: branch.name,
            label: branch.name,
            tag: branch.name === base ? t('COMMANDS.WHOLE_APP') : null,
            detail:
              branch.pullRequest === null
                ? null
                : `#${String(branch.pullRequest.number)} ${branch.pullRequest.title}`,
            isDisabled: false,
          }))
      : [];

  const rows =
    step === 'command'
      ? commandRows
      : step === 'repository'
        ? repositoryRows
        : branchRows;
  const query = (step === 'command' ? (slash ?? '') : draft).trim();
  const note =
    step === 'branch' && branchList === null
      ? t('COMMANDS.BRANCH_LOADING')
      : step === 'branch' && branchList?.isListed === false
        ? t(GITHUB_FAILURE_KEYS[branchList.failure])
        : rows.length === 0 && query !== ''
          ? t('COMMANDS.NONE', { query })
          : null;
  const label = CHAT_COMMANDS.find(({ id }) => id === command?.id)?.labelKey;

  return {
    command:
      command === null
        ? null
        : ({
            name: label === undefined ? '' : t(label),
            repository: repository === null ? null : keyOf(repository),
            branch: command.branch,
            isReady: step === 'ready',
            placeholder:
              step === 'repository'
                ? t('COMMANDS.PICK_REPOSITORY')
                : step === 'branch'
                  ? t('COMMANDS.PICK_BRANCH')
                  : t('COMMANDS.NOTE'),
          } satisfies IComposerCommand),
    picker:
      step === null || step === 'ready'
        ? null
        : ({
            heading:
              step === 'command'
                ? t('COMMANDS.HEADING')
                : step === 'repository' || repository === null
                  ? t('COMMANDS.REPOSITORY_HEADING')
                  : t('COMMANDS.BRANCH_HEADING', { repository: keyOf(repository) }),
            rows,
            note,
            hint: t('COMMANDS.HINT'),
          } satisfies ICommandPicker),
    start,
    onPick: (id: string) => {
      if (step === 'command') {
        const row = commandRows.find((one) => one.id === id);
        const picked = CHAT_COMMANDS.find((one) => one.id === id);

        if (row !== undefined && !row.isDisabled && picked !== undefined)
          start(picked.id);

        return;
      }

      if (command === null) return;

      if (step === 'repository') {
        const picked = repositories.find((one) => keyOf(one) === id);

        if (picked === undefined) return;

        setCommand({ ...command, repository: picked, branch: null });
        load(picked);
        onDraft('');
      } else if (step === 'branch') {
        setCommand({ ...command, branch: id });
        onDraft('');
      }
    },
    onBack: () => {
      if (command === null) return;

      if (command.branch !== null) setCommand({ ...command, branch: null });
      else if (command.repository !== null && repositories.length > 1)
        setCommand({ ...command, repository: null });
      else setCommand(null);
    },
    onCancel: () => {
      setCommand(null);
    },
    ask: (words: string) => {
      if (command === null || repository === null || command.branch === null) return null;

      const name = keyOf(repository);
      const say =
        command.branch === repository.baseBranch
          ? t('COMMANDS.CODE_PLAN_SAY_WHOLE', {
              repository: name,
              branch: command.branch,
            })
          : t('COMMANDS.CODE_PLAN_SAY', {
              repository: name,
              branch: command.branch,
              base: repository.baseBranch,
            });
      const note = words.trim();

      return {
        text: note === '' ? say : `${say}\n\n${note}`,
        code: {
          owner: repository.owner,
          name: repository.name,
          base: repository.baseBranch,
          branch: command.branch,
        } satisfies ICodeAsk,
        command: {
          id: command.id,
          repository: name,
          branch: command.branch,
          base: repository.baseBranch,
        } satisfies IUserCommand,
      };
    },
    clear: () => {
      setCommand(null);
    },
  };
};
