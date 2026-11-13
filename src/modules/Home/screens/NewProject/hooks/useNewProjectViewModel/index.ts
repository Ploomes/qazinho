import type {
  INewProject,
  INewProjectValues,
  NewProjectStart,
  NewProjectStep,
  NothingWay,
  ProjectPick,
} from '@/modules/Home/types';
import type { ITarget } from '@/modules/Project/types';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatAgent } from '@/modules/Chat';
import { PROJECT_PICKS } from '@/modules/Home/constants';
import {
  autoProjectNameOf,
  missingPicksOf,
  newProjectOf,
  nothingProjectOf,
  withPick,
} from '@/modules/Home/library';
import {
  EMPTY_PROJECT_VALUES,
  FIELD_LABEL_KEYS,
  NEW_PROJECT_SCREEN,
} from '@/modules/Home/screens/NewProject/constants';
import {
  projectAppOf,
  projectMarkOf,
  useSiteIcons,
  webAddressOf,
} from '@/modules/Project';
import { TARGET_NAME_KEYS } from '@/modules/Project/components/ProjectModal/constants';
import { useRunActions } from '@/modules/Run';
import { Sites } from '@/services';
import { MOTION } from '@/shared/constants';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useNewProjectViewModel = () => {
  const { t, i18n } = useTranslation();
  const closeNewProject = useAppStore((state) => state.closeNewProject);
  const putProject = useAppStore((state) => state.putProject);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const requestImport = useAppStore((state) => state.requestImport);
  const addWorkspace = useWorkspaceStore((state) => state.addWorkspace);
  const sendMessage = useWorkspaceStore((state) => state.sendMessage);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const { askAgent } = useChatAgent();
  const { runWorkspace } = useRunActions();
  const [step, setStep] = useState<NewProjectStep>('pick');
  const [direction, setDirection] = useState(1);
  const [picks, setPicks] = useState<ProjectPick[]>([]);
  const [values, setValues] = useState<INewProjectValues>(EMPTY_PROJECT_VALUES);
  const [typedName, setTypedName] = useState<string | null>(null);
  const [way, setWay] = useState<NothingWay>('example');
  const [idea, setIdea] = useState('');
  const [ideaName, setIdeaName] = useState('');
  const [isCreating, setCreating] = useState(false);
  const [failure, setFailure] = useState('');

  const isNothing = picks.includes('none');
  const address = picks.includes('web') ? webAddressOf(values.web) : null;
  const icons = useSiteIcons(address === null ? [] : [address]);
  const name = typedName ?? autoProjectNameOf({ picks, values });
  const missing = missingPicksOf({ picks, values });
  const labels = {
    web: t(TARGET_NAME_KEYS.web),
    android: t(TARGET_NAME_KEYS.android),
    ios: t(TARGET_NAME_KEYS.ios),
  };
  const preview: ITarget[] = [
    ...(address === null
      ? []
      : [{ id: 't-web', kind: 'web' as const, label: labels.web, value: address }]),
    ...(picks.includes('build')
      ? values.builds.map((build) => ({
          id: `t-${build.kind}`,
          kind: build.kind,
          label: labels[build.kind],
          value: build.path,
        }))
      : []),
  ];
  const canCreate = missing.length === 0 && name.trim() !== '' && !isCreating;
  const canStart = !isCreating && (way === 'example' || idea.trim() !== '');

  const go = (props: { to: NewProjectStep; direction: number }) => {
    setDirection(props.direction);
    setStep(props.to);
    setFailure('');
  };
  const back = () => {
    go({ to: 'pick', direction: -1 });
  };
  const goOn = () => {
    if (picks.length === 0) return;

    go({ to: isNothing ? 'nothing' : 'fill', direction: 1 });
  };
  const change = <K extends keyof INewProjectValues>(props: {
    key: K;
    value: INewProjectValues[K];
  }) => {
    setValues((before) => ({ ...before, [props.key]: props.value }));
  };

  const begin = (start: NewProjectStart) => {
    const { workspaceId } = start;

    if (start.kind === 'import') {
      requestImport({ workspaceId, source: start.source });

      return;
    }

    if (start.kind === 'explore') {
      void runWorkspace(workspaceId, 'explore');

      return;
    }

    if (start.kind === 'idea') {
      sendMessage({ workspaceId, text: start.text, mentions: [] });
      askAgent({
        workspaceId,
        text: start.text,
        references: [],
        code: null,
        jira: null,
        confluence: null,
      });

      return;
    }

    if (start.kind === 'design') {
      const text = t('COMMANDS.FIGMA_PLAN_SAY', { name: start.design.name });

      sendMessage({
        workspaceId,
        text,
        mentions: [],
        command: {
          id: 'figma-plan',
          name: start.design.name,
          nodeId: start.design.nodeId,
          url: start.design.url,
        },
      });
      askAgent({
        workspaceId,
        text,
        references: [],
        code: null,
        jira: null,
        confluence: null,
      });

      return;
    }

    const { story, design } = start;
    const text = [
      story.kind === 'jira'
        ? t('COMMANDS.JIRA_PLAN_SAY', {
            key: story.issue.key,
            summary: story.issue.summary,
          })
        : t('COMMANDS.CONFLUENCE_PLAN_SAY', { title: story.page.title }),
      ...(design === null ? [] : [t('COMMANDS.FIGMA_PLAN_SAY', { name: design.name })]),
    ].join('\n\n');

    sendMessage({
      workspaceId,
      text,
      mentions: [],
      command:
        story.kind === 'jira'
          ? { id: 'jira-plan', ...story.issue }
          : {
              id: 'confluence-plan',
              pageId: story.page.id,
              title: story.page.title,
              space: story.page.space,
              url: story.page.url,
            },
    });
    askAgent({
      workspaceId,
      text,
      references: [],
      code: null,
      jira: story.kind === 'jira' ? { key: story.issue.key } : null,
      confluence: story.kind === 'page' ? { pageId: story.page.id } : null,
    });
  };
  const launch = (made: INewProject) => {
    putProject(made.project);

    for (const workspace of made.workspaces) addWorkspace(workspace);

    selectWorkspace(made.openId);
    selectTab('chat');

    for (const start of made.starts) begin(start);
  };
  const create = (now: number) => {
    if (!canCreate) return;

    setCreating(true);
    launch(newProjectOf({ picks, values, name, now, labels }));
  };
  const startFromNothing = async (now: number) => {
    if (!canStart) return;

    setCreating(true);
    setFailure('');

    const shop = way === 'example' ? await Sites.exampleShop(i18n.language) : null;

    if (way === 'example' && shop === null) {
      setCreating(false);
      setFailure(t('NEW_PROJECT.FAILED_SHOP'));

      return;
    }

    launch(
      nothingProjectOf({
        way,
        name:
          way === 'example'
            ? t('NEW_PROJECT.EXAMPLE_NAME')
            : ideaName.trim() || t('NEW_PROJECT.IDEA_PROJECT'),
        address: shop,
        text: idea,
        now,
        words: { web: labels.web, explore: t('NEW_PROJECT.EXPLORE_PLAN') },
      }),
    );
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || isCreating) return;

      if (step === 'pick') closeNewProject();
      else {
        setDirection(-1);
        setStep('pick');
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [step, isCreating, closeNewProject]);

  const count = picks.length;
  const list = new Intl.ListFormat(i18n.language, { style: 'long', type: 'conjunction' });

  return {
    style: {
      '--new-project-column': `${String(NEW_PROJECT_SCREEN.column)}px`,
    } as CSSProperties,
    stepKey: step,
    direction,
    isPick: step === 'pick',
    isFill: step === 'fill',
    isNothingStep: step === 'nothing',
    title:
      step === 'pick'
        ? t('NEW_PROJECT.TITLE')
        : step === 'fill'
          ? t('NEW_PROJECT.FILL_TITLE')
          : t('NEW_PROJECT.NOTHING_TITLE'),
    lead:
      step === 'pick'
        ? t('NEW_PROJECT.LEAD')
        : step === 'fill'
          ? t('NEW_PROJECT.FILL_LEAD')
          : t('NEW_PROJECT.NOTHING_LEAD'),
    pick: {
      cards: PROJECT_PICKS.map((card, index) => ({
        id: card.id,
        icon: card.icon,
        label: t(card.labelKey),
        text: t(card.textKey),
        isOn: picks.includes(card.id),
        className: picks.includes(card.id) ? 'pick-card pick-card--on' : 'pick-card',
        opacity: isNothing ? NEW_PROJECT_SCREEN.dimmed : 1,
        delay: Math.min(index * MOTION.stagger, MOTION.maxStagger),
        onToggle: () => {
          setPicks(withPick({ picks, pick: card.id }));
        },
      })),
      none: {
        label: t('NEW_PROJECT.NONE'),
        text: t('NEW_PROJECT.NONE_TEXT'),
        isOn: isNothing,
        className: isNothing ? 'pick-none pick-none--on' : 'pick-none',
        delay: Math.min(PROJECT_PICKS.length * MOTION.stagger, MOTION.maxStagger),
        onToggle: () => {
          setPicks(withPick({ picks, pick: 'none' }));
        },
      },
      countLabel: isNothing
        ? t('NEW_PROJECT.COUNT_NOTHING')
        : count === 0
          ? t('NEW_PROJECT.COUNT_NONE')
          : count === 1
            ? t('NEW_PROJECT.COUNT_ONE')
            : t('NEW_PROJECT.COUNT_OTHER', { count }),
      canContinue: count > 0,
      continueLabel: t('NEW_PROJECT.CONTINUE'),
      cancelLabel: t('NEW_PROJECT.CANCEL'),
      onContinue: goOn,
      onCancel: closeNewProject,
    },
    fill: {
      fields: picks.map((pick, index) => ({
        key: pick,
        isWeb: pick === 'web',
        isBuild: pick === 'build',
        isCode: pick === 'code',
        isTests: pick === 'tests',
        isStory: pick === 'story',
        isDesign: pick === 'design',
        delay: Math.min(index * MOTION.stagger, MOTION.maxStagger),
      })),
      web: values.web,
      builds: values.builds,
      repositories: values.repositories,
      tests: values.tests,
      story: values.story,
      design: values.design,
      onWeb: (web: string) => {
        change({ key: 'web', value: web });
      },
      onBuilds: (builds: INewProjectValues['builds']) => {
        change({ key: 'builds', value: builds });
      },
      onRepositories: (repositories: INewProjectValues['repositories']) => {
        change({ key: 'repositories', value: repositories });
      },
      onTests: (tests: INewProjectValues['tests']) => {
        change({ key: 'tests', value: tests });
      },
      onStory: (story: INewProjectValues['story']) => {
        change({ key: 'story', value: story });
      },
      onDesign: (design: INewProjectValues['design']) => {
        change({ key: 'design', value: design });
      },
      nameLabel: t('NEW_PROJECT.NAME_LABEL'),
      namePlaceholder: t('NEW_PROJECT.NAME_PLACEHOLDER'),
      name,
      onName: setTypedName,
      mark: projectMarkOf({
        name: name.trim() || '?',
        app: projectAppOf(preview),
        icons,
      }),
      markSize: NEW_PROJECT_SCREEN.markSize,
      hasMissing: missing.length > 0,
      missingText: t('NEW_PROJECT.MISSING', {
        fields: list.format(
          missing.map((pick) => t(FIELD_LABEL_KEYS[pick]).toLowerCase()),
        ),
      }),
      backLabel: t('NEW_PROJECT.BACK'),
      createLabel: isCreating ? t('NEW_PROJECT.CREATING') : t('NEW_PROJECT.CREATE'),
      canCreate,
      onBack: back,
      onCreate: () => {
        create(Date.now());
      },
    },
    nothing: {
      ways: (['example', 'idea'] as const).map((id, index) => ({
        id,
        icon: id === 'example' ? ('shop' as const) : ('idea' as const),
        label: id === 'example' ? t('NEW_PROJECT.EXAMPLE') : t('NEW_PROJECT.IDEA'),
        text:
          id === 'example' ? t('NEW_PROJECT.EXAMPLE_TEXT') : t('NEW_PROJECT.IDEA_TEXT'),
        isOn: way === id,
        className: way === id ? 'pick-card pick-card--on' : 'pick-card',
        delay: index * MOTION.stagger,
        onPick: () => {
          setWay(id);
          setFailure('');
        },
      })),
      isIdea: way === 'idea',
      idea,
      ideaLabel: t('NEW_PROJECT.IDEA'),
      ideaPlaceholder: t('NEW_PROJECT.IDEA_PLACEHOLDER'),
      onIdea: setIdea,
      ideaName,
      ideaNameLabel: t('NEW_PROJECT.NAME_LABEL'),
      ideaNamePlaceholder: t('NEW_PROJECT.IDEA_NAME_PLACEHOLDER'),
      onIdeaName: setIdeaName,
      hasFailure: failure !== '',
      failure,
      backLabel: t('NEW_PROJECT.BACK'),
      startLabel: isCreating ? t('NEW_PROJECT.CREATING') : t('NEW_PROJECT.START'),
      canStart,
      onBack: back,
      onStart: () => {
        void startFromNothing(Date.now());
      },
    },
  };
};
