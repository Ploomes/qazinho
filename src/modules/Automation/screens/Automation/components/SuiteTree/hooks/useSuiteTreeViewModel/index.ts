import type { ISuiteTreeProps } from '@/modules/Automation/screens/Automation/components/SuiteTree/types';
import { useTranslation } from 'react-i18next';
import { SUITE_TEST_STATES } from '@/modules/Automation/constants';
import { testStateOf } from '@/modules/Automation/library';
import { formatRequestTime } from '@/modules/Run';
import { MOTION } from '@/shared/constants';

export const useSuiteTreeViewModel = (props: ISuiteTreeProps) => {
  const { t, i18n } = useTranslation();
  const { last, going, pickedId, canRun } = props;

  return {
    foldTransition: { duration: MOTION.duration, ease: MOTION.ease },
    stepTransition: { duration: MOTION.durationFast, ease: MOTION.ease },
    folders: props.folders.map((folder) => {
      const tests = folder.files.flatMap((file) => file.tests);
      const states = tests.map((test) =>
        testStateOf({ isGoing: test.id in going, last: last[test.id] }),
      );
      const isOpen = props.isQuerying || !props.shut.includes(folder.path);

      return {
        key: folder.path,
        name: folder.name === '' ? '/' : folder.name,
        count:
          tests.length === 1
            ? t('AUTOMATION.TESTS_ONE')
            : t('AUTOMATION.TESTS_OTHER', { count: tests.length }),
        passed: states.filter((state) => state === 'passed' || state === 'flaky').length,
        failed: states.filter((state) => state === 'failed').length,
        isOpen,
        caretLabel: folder.name,
        canRun,
        runLabel: t('AUTOMATION.RUN_NAMED', { name: folder.name }),
        onToggle: () => {
          props.onToggle(folder.path);
        },
        onRun: () => {
          props.onRunPath(folder.path);
        },
        files: folder.files.map((file) => ({
          key: file.path,
          name: file.name,
          runLabel: t('AUTOMATION.RUN_NAMED', { name: file.name }),
          onRun: () => {
            props.onRunPath(file.path);
          },
          tests: file.tests.map((test) => {
            const state = testStateOf({ isGoing: test.id in going, last: last[test.id] });
            const look = SUITE_TEST_STATES[state];
            const result = last[test.id]?.result;
            const isShared =
              file.tests.filter(
                ({ line, title }) => line === test.line && title === test.title,
              ).length > 1;

            return {
              key: test.id,
              title: test.title,
              tags: test.tags.map((tag) => `@${tag}`),
              project: isShared ? test.project : '',
              icon: look.icon,
              stateClassName: `suite-tree__state suite-tree__state--${look.tone}`,
              stateWord: t(look.labelKey),
              step: going[test.id] ?? null,
              duration:
                result === undefined || state === 'running' || state === 'skipped'
                  ? ''
                  : formatRequestTime({ ms: result.durationMs, language: i18n.language }),
              className:
                test.id === pickedId
                  ? 'suite-tree__test suite-tree__test--picked'
                  : 'suite-tree__test',
              isPicked: test.id === pickedId,
              runLabel: t('AUTOMATION.RUN_NAMED', { name: test.title }),
              onPick: () => {
                props.onPick(test.id);
              },
              onRun: () => {
                props.onRunTest(test.id);
              },
            };
          }),
        })),
      };
    }),
  };
};
