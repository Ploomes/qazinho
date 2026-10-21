import type { IBuildProgressProps } from '@/modules/Build/components/BuildProgress/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BUILD_PROGRESS } from '@/modules/Build/components/BuildProgress/constants';
import { BUILD_FAILURE_KEYS, BUILD_STEPS } from '@/modules/Build/constants';
import { useBuildActions } from '@/modules/Build/hooks/useBuildActions';
import { formatSize } from '@/modules/Chat';
import { formatElapsed } from '@/modules/Device';
import { GITHUB_FAILURE_KEYS } from '@/modules/Setup';
import { useBuildStore, useSettingsStore } from '@/store';

export const useBuildProgressViewModel = (props: IBuildProgressProps) => {
  const { t, i18n } = useTranslation();
  const build = useBuildStore(
    (state) => state.builds.find(({ id }) => id === props.buildId) ?? null,
  );
  const agent = useSettingsStore((state) => state.agent);
  const { stopBuild } = useBuildActions();
  const [now, setNow] = useState(() => Date.now());
  const isWorking = build?.phase === 'working';

  useEffect(() => {
    if (!isWorking) return;

    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => {
      window.clearInterval(id);
    };
  }, [isWorking]);

  if (build === null) return null;

  const at = BUILD_STEPS.indexOf(build.step);
  const result = build.result;
  const failure = result !== null && !result.isBuilt ? result.failure : null;
  const name = result?.isBuilt === true ? (result.artifact.split('/').at(-1) ?? '') : '';

  return {
    title: t(build.platform === 'android' ? 'BUILD.TITLE_ANDROID' : 'BUILD.TITLE_IOS', {
      repository: build.repository,
      branch: build.branch,
    }),
    mood:
      build.phase === 'built'
        ? ('passed' as const)
        : build.phase === 'failed'
          ? ('broken' as const)
          : build.phase === 'stopped'
            ? ('sleeping' as const)
            : ('running' as const),
    isWorking,
    internSize: BUILD_PROGRESS.internSize,
    hasActions:
      isWorking ||
      (props.onRetry !== undefined &&
        (build.phase === 'failed' || build.phase === 'stopped')),
    elapsed: formatElapsed(Math.max(0, Math.round((now - build.startedAt) / 1_000))),
    steps: BUILD_STEPS.map((step, index) => {
      const state =
        build.phase === 'built' || index < at
          ? 'done'
          : index > at
            ? 'waiting'
            : build.phase === 'working'
              ? 'doing'
              : 'failed';

      return {
        step,
        className: `build-progress__step build-progress__step--${state}`,
        icon:
          state === 'done'
            ? ('passed' as const)
            : state === 'failed'
              ? ('failed' as const)
              : null,
        label:
          step === 'code'
            ? build.bytes > 0 && state === 'doing'
              ? t('BUILD.STEP_CODE_SIZE', {
                  size: formatSize({ bytes: build.bytes, language: i18n.language }),
                })
              : t('BUILD.STEP_CODE')
            : step === 'agent'
              ? t('BUILD.STEP_AGENT', { agent })
              : t('BUILD.STEP_ARTIFACT'),
      };
    }),
    lines: isWorking ? build.lines : [],
    built:
      result?.isBuilt === true
        ? t('BUILD.BUILT', {
            name,
            size: formatSize({ bytes: result.bytes, language: i18n.language }),
          })
        : '',
    builtNote:
      result?.isBuilt === true && build.projectId !== null ? t('BUILD.BUILT_LINKED') : '',
    failed:
      failure === null
        ? ''
        : t(BUILD_FAILURE_KEYS[failure.reason], {
            agent,
            said: 'said' in failure ? failure.said : '',
            reason:
              failure.reason === 'code'
                ? t(GITHUB_FAILURE_KEYS[failure.failure])
                : failure.reason === 'agent'
                  ? 'said' in failure.failure
                    ? failure.failure.said
                    : t(
                        failure.failure.reason === 'agent-signed-out'
                          ? 'BUILD.SIGNED_OUT'
                          : 'BUILD.SILENT',
                        { agent },
                      )
                  : '',
          }),
    stopLabel: t('BUILD.STOP'),
    retryLabel: t('BUILD.RETRY'),
    canRetry:
      props.onRetry !== undefined &&
      (build.phase === 'failed' || build.phase === 'stopped'),
    onStop: () => {
      stopBuild(build.id);
    },
    onRetry: () => {
      props.onRetry?.();
    },
  };
};
