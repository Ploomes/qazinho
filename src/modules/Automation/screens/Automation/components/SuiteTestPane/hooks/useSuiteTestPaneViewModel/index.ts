import type { ISuiteTestPaneProps } from '@/modules/Automation/screens/Automation/components/SuiteTestPane/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUITE_RESULT_STATES } from '@/modules/Automation/constants';
import { formatSuiteWhen, resultStateOf } from '@/modules/Automation/library';
import { SUITE_TEST_PANE } from '@/modules/Automation/screens/Automation/components/SuiteTestPane/constants';
import { formatRequestTime } from '@/modules/Run';
import { Suites } from '@/services';
import { MOTION } from '@/shared/constants';
import { useAppStore } from '@/store';

export const useSuiteTestPaneViewModel = (props: ISuiteTestPaneProps) => {
  const { t, i18n } = useTranslation();
  const openMedia = useAppStore((state) => state.openMedia);
  const [shownRunId, setShownRunId] = useState<string | null>(null);
  const { projectId, test, isRunning } = props;
  const canRun = props.canRun && !isRunning;
  const results = props.runs
    .flatMap((run) => {
      const result = run.results.find(({ testId }) => testId === test.id);

      return result === undefined ? [] : [{ run, result }];
    })
    .slice(0, SUITE_TEST_PANE.history);
  const shown = results.find(({ run }) => run.id === shownRunId) ?? results[0] ?? null;
  const rows = results.map(({ run, result }) => {
    const look = SUITE_RESULT_STATES[resultStateOf(result)];

    return {
      run,
      result,
      icon: look.icon,
      word: t(look.labelKey),
      stateClassName: `suite-test-pane__state suite-test-pane__state--${look.tone}`,
      duration:
        result.status === 'skipped'
          ? ''
          : formatRequestTime({ ms: result.durationMs, language: i18n.language }),
      when: formatSuiteWhen({
        at: run.endedAt ?? run.startedAt,
        language: i18n.language,
      }),
    };
  });
  const current = rows.find(({ run }) => run.id === shown?.run.id) ?? null;
  const media = current?.result.attachments.filter(({ url }) => url !== null) ?? [];
  const shots = media.filter(({ contentType }) => contentType.startsWith('image/'));
  const trace = current?.result.attachments.find(({ name }) => name === 'trace');

  return {
    style: {
      '--suite-error-height': `${String(SUITE_TEST_PANE.errorHeight)}px`,
    } as CSSProperties,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
    trail: test.path.join(' · '),
    title: test.title,
    where: `${test.file}:${String(test.line)}`,
    project: props.hasProjects ? test.project : '',
    tags: test.tags.map((tag) => `@${tag}`),
    canRun,
    runLabel: t('AUTOMATION.RUN'),
    onRun: () => {
      if (canRun) props.onRun(test.id);
    },
    isRunning,
    runningWord: t('STATUS.RUNNING'),
    step: props.step,
    isNeverRun: current === null && !isRunning,
    neverRunText: t('AUTOMATION.NEVER_RAN'),
    result:
      current === null
        ? null
        : {
            key: current.run.id,
            icon: current.icon,
            word: current.word,
            stateClassName: current.stateClassName,
            facts: [current.run.id, current.duration, current.when]
              .filter((fact) => fact !== '')
              .join(' · '),
            error: current.result.error,
            errorLabel: t('AUTOMATION.ERROR'),
            shotClassName:
              current.result.status === 'passed'
                ? 'suite-test-pane__shot'
                : 'suite-test-pane__shot suite-test-pane__shot--bad',
            shots: shots.map((shot, index) => {
              const label =
                shots.length === 1
                  ? t('AUTOMATION.SCREENSHOT')
                  : `${t('AUTOMATION.SCREENSHOT')} ${String(index + 1)}`;

              return {
                key: shot.file,
                label,
                src: shot.url ?? '',
                onOpen: () => {
                  openMedia({
                    kicker: label,
                    title: test.title,
                    src: shot.url,
                    file: null,
                  });
                },
              };
            }),
            videos: media
              .filter(({ contentType }) => contentType.startsWith('video/'))
              .map((video) => ({
                key: video.file,
                src: video.url ?? '',
                label: t('AUTOMATION.VIDEO'),
              })),
            trace:
              trace === undefined
                ? null
                : {
                    label: t('AUTOMATION.OPEN_TRACE'),
                    tip: t('AUTOMATION.OPEN_TRACE_TIP'),
                    onOpen: () => {
                      void Suites.openTrace({
                        projectId,
                        runId: current.run.id,
                        file: trace.file,
                      });
                    },
                  },
          },
    hasHistory: rows.length > 1,
    historyLabel: t('AUTOMATION.HISTORY'),
    history: rows.map((row) => ({
      key: row.run.id,
      runId: row.run.id,
      icon: row.icon,
      word: row.word,
      stateClassName: row.stateClassName,
      duration: row.duration,
      when: row.when,
      isShown: row.run.id === current?.run.id,
      className:
        row.run.id === current?.run.id
          ? 'suite-test-pane__run suite-test-pane__run--shown'
          : 'suite-test-pane__run',
      onShow: () => {
        setShownRunId(row.run.id);
      },
    })),
  };
};
