import type {
  ChatCommandId,
  ICommandDraft,
  ICommandPart,
  ICommandPicker,
  ICommandRow,
  IComposerCommand,
  UserCommand,
} from '@/modules/Chat/types';
import type { IProjectRepository } from '@/modules/Project/types';
import type {
  IBranch,
  IBranchList,
  ICodeAsk,
  ConfluencePageList,
  IConfluenceAsk,
  IDesignLink,
  IImportAsk,
  IImportSource,
  IJiraAsk,
  JiraIssueList,
} from '@/shared/types';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { matchesQuery } from '@/modules/Chat/library';
import {
  CHAT_COMMANDS,
  COMMAND_SEARCH,
  IMPORT_FAILURE_KEYS,
} from '@/modules/Chat/screens/Chat/constants';
import {
  CONFLUENCE_FAILURE_KEYS,
  GITHUB_FAILURE_KEYS,
  JIRA_FAILURE_KEYS,
} from '@/modules/Setup';
import { designLinkOf } from '@/modules/Workspace';
import { Confluence, Github, Imports, Jira } from '@/services';

export const useChatCommand = (props: {
  draft: string;
  repositories: IProjectRepository[];
  isGithubConnected: boolean;
  isJiraConnected: boolean;
  isConfluenceOn: boolean;
  onDraft: (draft: string) => void;
}) => {
  const {
    draft,
    repositories,
    isGithubConnected,
    isJiraConnected,
    isConfluenceOn,
    onDraft,
  } = props;
  const { t } = useTranslation();
  const [command, setCommand] = useState<ICommandDraft | null>(null);
  const [branchLists, setBranchLists] = useState<Record<string, IBranchList>>({});
  const [found, setFound] = useState<{ query: string; list: JiraIssueList } | null>(null);
  const [foundPages, setFoundPages] = useState<{
    query: string;
    list: ConfluencePageList;
  } | null>(null);
  const [folderFailure, setFolderFailure] = useState<'empty' | 'unreadable' | null>(null);
  const searches = useRef(0);

  const keyOf = (repository: IProjectRepository) =>
    `${repository.owner}/${repository.name}`;
  const frameworksText = (one: IImportSource) =>
    one.frameworks.length === 0
      ? t('COMMANDS.IMPORT_UNKNOWN')
      : one.frameworks.map(({ id }) => id).join(' · ');
  const slash = command === null && /^\/\S*$/.test(draft) ? draft.slice(1) : null;
  const step =
    command === null
      ? slash === null
        ? null
        : 'command'
      : command.id === 'jira-plan'
        ? command.issue === null
          ? 'story'
          : 'ready'
        : command.id === 'confluence-plan'
          ? command.page === null
            ? 'page'
            : 'ready'
          : command.id === 'figma-plan'
            ? command.design === null
              ? 'design'
              : 'ready'
            : command.id === 'import-plan'
              ? command.folder === null
                ? 'folder'
                : 'ready'
              : command.repository === null
                ? 'repository'
                : command.branch === null
                  ? 'branch'
                  : 'ready';
  const blockerOf = (id: ChatCommandId) =>
    id === 'figma-plan' || id === 'import-plan'
      ? null
      : id === 'jira-plan'
        ? isJiraConnected
          ? null
          : t('COMMANDS.NEEDS_JIRA')
        : id === 'confluence-plan'
          ? isConfluenceOn
            ? null
            : t('COMMANDS.NEEDS_CONFLUENCE')
          : !isGithubConnected
            ? t('COMMANDS.NEEDS_GITHUB')
            : repositories.length === 0
              ? t('COMMANDS.NEEDS_REPOSITORIES')
              : null;
  const repository = command?.repository ?? null;
  const base = repository?.baseBranch ?? '';
  const branchList =
    repository === null ? null : (branchLists[keyOf(repository)] ?? null);
  const typed = draft.trim();

  useEffect(() => {
    if (step !== 'story') return;

    const asked = typed;
    const timer = setTimeout(
      () => {
        searches.current += 1;

        const search = searches.current;

        void Jira.search(asked).then((list) => {
          if (search === searches.current) setFound({ query: asked, list });
        });
      },
      asked === '' ? 0 : COMMAND_SEARCH.debounceMs,
    );

    return () => {
      clearTimeout(timer);
    };
  }, [step, typed]);

  useEffect(() => {
    if (step !== 'page') return;

    const asked = typed;
    const timer = setTimeout(
      () => {
        searches.current += 1;

        const search = searches.current;

        void Confluence.search(asked).then((list) => {
          if (search === searches.current) setFoundPages({ query: asked, list });
        });
      },
      asked === '' ? 0 : COMMAND_SEARCH.debounceMs,
    );

    return () => {
      clearTimeout(timer);
    };
  }, [step, typed]);

  const load = (picked: IProjectRepository) => {
    if (branchLists[keyOf(picked)] !== undefined) return;

    void Github.branches({ owner: picked.owner, name: picked.name }).then((list) => {
      setBranchLists((kept) => ({ ...kept, [keyOf(picked)]: list }));
    });
  };

  const pickFolder = () => {
    void Imports.pick().then((picked) => {
      if (picked.kind === 'picked')
        setCommand((kept) =>
          kept?.id === 'import-plan' ? { ...kept, folder: picked.source } : kept,
        );

      setFolderFailure(picked.kind === 'failed' ? picked.reason : null);
    });
  };

  const start = (id: ChatCommandId) => {
    const only =
      id === 'code-plan' && repositories.length === 1 ? (repositories[0] ?? null) : null;

    setCommand({
      id,
      repository: only,
      branch: null,
      issue: null,
      page: null,
      design: null,
      folder: null,
    });
    if (only !== null) load(only);
    if (id === 'jira-plan') setFound(null);
    if (id === 'confluence-plan') setFoundPages(null);
    if (id === 'import-plan') {
      setFolderFailure(null);
      pickFolder();
    }

    onDraft('');
  };

  const commandRows: ICommandRow[] = CHAT_COMMANDS.filter((one) =>
    matchesQuery({
      text: `${one.slug} ${t(one.labelKey)} ${one.aliases}`,
      query: slash ?? '',
    }),
  ).map((one) => {
    const blocker = blockerOf(one.id);

    return {
      id: one.id,
      label: t(one.labelKey),
      tag: one.slug,
      detail: blocker ?? t(one.textKey),
      isDisabled: blocker !== null,
    };
  });

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

  const stories = found?.list.isListed === true ? found.list.issues : [];
  const storyRows: ICommandRow[] = stories.map((issue) => ({
    id: issue.key,
    label: issue.key,
    tag: null,
    detail: issue.summary,
    isDisabled: false,
  }));

  const pages = foundPages?.list.isListed === true ? foundPages.list.pages : [];
  const pageRows: ICommandRow[] = pages.map((page) => ({
    id: page.id,
    label: page.title,
    tag: page.space === '' ? null : page.space,
    detail: null,
    isDisabled: false,
  }));

  const pasted = step === 'design' ? designLinkOf(typed) : null;
  const nodeOf = (design: IDesignLink) =>
    design.nodeId === null
      ? t('COMMANDS.DESIGN_WHOLE_FILE')
      : t('COMMANDS.DESIGN_NODE', { node: design.nodeId });
  const designRows: ICommandRow[] =
    pasted === null
      ? []
      : [
          {
            id: pasted.url,
            label: pasted.name,
            tag: null,
            detail: nodeOf(pasted),
            isDisabled: false,
          },
        ];

  const folderRows: ICommandRow[] = [
    {
      id: 'pick-folder',
      label: t('COMMANDS.IMPORT_PICK'),
      tag: null,
      detail: null,
      isDisabled: false,
    },
  ];

  const rows =
    step === 'command'
      ? commandRows
      : step === 'repository'
        ? repositoryRows
        : step === 'story'
          ? storyRows
          : step === 'page'
            ? pageRows
            : step === 'design'
              ? designRows
              : step === 'folder'
                ? folderRows
                : branchRows;
  const query = (step === 'command' ? (slash ?? '') : draft).trim();
  const note =
    step === 'branch' && branchList === null
      ? t('COMMANDS.BRANCH_LOADING')
      : step === 'branch' && branchList?.isListed === false
        ? t(GITHUB_FAILURE_KEYS[branchList.failure])
        : step === 'story' && found?.list.isListed === false
          ? t(JIRA_FAILURE_KEYS[found.list.failure])
          : step === 'story' && found?.query !== typed
            ? t('COMMANDS.STORY_SEARCHING')
            : step === 'page' && foundPages?.list.isListed === false
              ? t(CONFLUENCE_FAILURE_KEYS[foundPages.list.failure])
              : step === 'page' && foundPages?.query !== typed
                ? t('COMMANDS.PAGE_SEARCHING')
                : step === 'design' && typed !== '' && pasted === null
                  ? t('COMMANDS.DESIGN_NOT_LINK')
                  : step === 'design'
                    ? null
                    : step === 'folder'
                      ? folderFailure === null
                        ? null
                        : t(IMPORT_FAILURE_KEYS[folderFailure])
                      : rows.length === 0 && query !== ''
                        ? t('COMMANDS.NONE', { query })
                        : null;
  const label = CHAT_COMMANDS.find(({ id }) => id === command?.id)?.labelKey;
  const issue = command?.issue ?? null;
  const page = command?.page ?? null;
  const branch = command?.branch ?? null;
  const design = command?.design ?? null;
  const folder = command?.folder ?? null;
  const parts: ICommandPart[] =
    folder !== null
      ? [
          { key: `name-${folder.dir}`, text: folder.name, isStrong: true },
          { key: `kinds-${folder.dir}`, text: frameworksText(folder), isStrong: false },
        ]
      : design !== null
        ? [
            { key: `name-${design.url}`, text: design.name, isStrong: true },
            { key: `node-${design.url}`, text: nodeOf(design), isStrong: false },
          ]
        : issue !== null
          ? [
              { key: `key-${issue.key}`, text: issue.key, isStrong: true },
              { key: `summary-${issue.key}`, text: issue.summary, isStrong: false },
            ]
          : page !== null
            ? [
                { key: `title-${page.id}`, text: page.title, isStrong: true },
                ...(page.space === ''
                  ? []
                  : [{ key: `space-${page.id}`, text: page.space, isStrong: false }]),
              ]
            : [
                ...(repository === null
                  ? []
                  : [
                      {
                        key: keyOf(repository),
                        text: keyOf(repository),
                        isStrong: false,
                      },
                    ]),
                ...(branch === null
                  ? []
                  : [{ key: `branch-${branch}`, text: branch, isStrong: true }]),
              ];

  return {
    command:
      command === null
        ? null
        : ({
            name: label === undefined ? '' : t(label),
            parts,
            isReady: step === 'ready',
            placeholder:
              step === 'repository'
                ? t('COMMANDS.PICK_REPOSITORY')
                : step === 'branch'
                  ? t('COMMANDS.PICK_BRANCH')
                  : step === 'story'
                    ? t('COMMANDS.PICK_STORY')
                    : step === 'page'
                      ? t('COMMANDS.PICK_PAGE')
                      : step === 'design'
                        ? t('COMMANDS.PICK_DESIGN')
                        : step === 'folder'
                          ? t('COMMANDS.PICK_FOLDER')
                          : t('COMMANDS.NOTE'),
          } satisfies IComposerCommand),
    picker:
      step === null || step === 'ready'
        ? null
        : ({
            heading:
              step === 'command'
                ? t('COMMANDS.HEADING')
                : step === 'story'
                  ? typed === ''
                    ? t('COMMANDS.STORY_RECENT')
                    : t('COMMANDS.STORY_HEADING')
                  : step === 'page'
                    ? typed === ''
                      ? t('COMMANDS.PAGE_RECENT')
                      : t('COMMANDS.PAGE_HEADING')
                    : step === 'design'
                      ? t('COMMANDS.DESIGN_HEADING')
                      : step === 'folder'
                        ? t('COMMANDS.IMPORT_HEADING')
                        : step === 'repository' || repository === null
                          ? t('COMMANDS.REPOSITORY_HEADING')
                          : t('COMMANDS.BRANCH_HEADING', {
                              repository: keyOf(repository),
                            }),
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

      if (step === 'folder') {
        pickFolder();
      } else if (step === 'design') {
        if (pasted === null) return;

        setCommand({ ...command, design: pasted });
        onDraft('');
      } else if (step === 'page') {
        const picked = pages.find((one) => one.id === id);

        if (picked === undefined) return;

        setCommand({ ...command, page: picked });
        onDraft('');
      } else if (step === 'story') {
        const picked = stories.find(({ key }) => key === id);

        if (picked === undefined) return;

        setCommand({ ...command, issue: picked });
        onDraft('');
      } else if (step === 'repository') {
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

      if (command.folder !== null) setCommand({ ...command, folder: null });
      else if (command.design !== null) setCommand({ ...command, design: null });
      else if (command.issue !== null) setCommand({ ...command, issue: null });
      else if (command.page !== null) setCommand({ ...command, page: null });
      else if (command.branch !== null) setCommand({ ...command, branch: null });
      else if (command.repository !== null && repositories.length > 1)
        setCommand({ ...command, repository: null });
      else setCommand(null);
    },
    onCancel: () => {
      setCommand(null);
    },
    ask: (words: string) => {
      const note = words.trim();

      if (command?.id === 'import-plan') {
        const { folder: picked } = command;

        if (picked === null) return null;

        const say = t('COMMANDS.IMPORT_PLAN_SAY', { name: picked.name });

        return {
          text: note === '' ? say : `${say}\n\n${note}`,
          code: null,
          jira: null,
          confluence: null,
          design: null,
          source: { dir: picked.dir } satisfies IImportAsk,
          command: {
            id: 'import-plan',
            name: picked.name,
            frameworks: picked.frameworks.map(({ id }) => id),
            tests: picked.files.length,
          } satisfies UserCommand,
        };
      }

      if (command?.id === 'figma-plan') {
        if (command.design === null) return null;

        const say = t('COMMANDS.FIGMA_PLAN_SAY', { name: command.design.name });

        return {
          text: note === '' ? say : `${say}\n\n${note}`,
          code: null,
          jira: null,
          confluence: null,
          design: command.design,
          source: null,
          command: {
            id: 'figma-plan',
            name: command.design.name,
            nodeId: command.design.nodeId,
            url: command.design.url,
          } satisfies UserCommand,
        };
      }

      if (command?.id === 'confluence-plan') {
        const { page: picked } = command;

        if (picked === null) return null;

        const say = t('COMMANDS.CONFLUENCE_PLAN_SAY', { title: picked.title });

        return {
          text: note === '' ? say : `${say}\n\n${note}`,
          code: null,
          jira: null,
          confluence: { pageId: picked.id } satisfies IConfluenceAsk,
          design: null,
          source: null,
          command: {
            id: 'confluence-plan',
            pageId: picked.id,
            title: picked.title,
            space: picked.space,
            url: picked.url,
          } satisfies UserCommand,
        };
      }

      if (command?.id === 'jira-plan') {
        const { issue } = command;

        if (issue === null) return null;

        const say = t('COMMANDS.JIRA_PLAN_SAY', {
          key: issue.key,
          summary: issue.summary,
        });

        return {
          text: note === '' ? say : `${say}\n\n${note}`,
          code: null,
          jira: { key: issue.key } satisfies IJiraAsk,
          confluence: null,
          design: null,
          source: null,
          command: {
            id: 'jira-plan',
            key: issue.key,
            summary: issue.summary,
            url: issue.url,
          } satisfies UserCommand,
        };
      }

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

      return {
        text: note === '' ? say : `${say}\n\n${note}`,
        code: {
          owner: repository.owner,
          name: repository.name,
          base: repository.baseBranch,
          branch: command.branch,
        } satisfies ICodeAsk,
        jira: null,
        confluence: null,
        design: null,
        source: null,
        command: {
          id: 'code-plan',
          repository: name,
          branch: command.branch,
          base: repository.baseBranch,
        } satisfies UserCommand,
      };
    },
    clear: () => {
      setCommand(null);
    },
  };
};
