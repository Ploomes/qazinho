import type { IMomentTileProps } from '@/modules/Bug/screens/Bugs/components/BugPage/components/MomentTile/types';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Run } from '@/services';
import { useAppStore } from '@/store';

export const useMomentTileViewModel = (props: IMomentTileProps) => {
  const { bugId, moment } = props;
  const { workspaceId, runId, atMs } = moment;
  const { t } = useTranslation();
  const openReplay = useAppStore((state) => state.openReplay);
  const [url, setUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let isCurrent = true;

    void Run.replayUrl({ workspaceId, runId }).then((found) => {
      if (isCurrent) setUrl(found);
    });

    return () => {
      isCurrent = false;
    };
  }, [workspaceId, runId]);

  return {
    label: t('BUG.WATCH_MOMENT'),
    hasVideo: url !== null,
    src: url ?? undefined,
    videoRef,
    onLoadedMetadata: () => {
      if (videoRef.current) videoRef.current.currentTime = atMs / 1000;
    },
    onOpen: () => {
      openReplay({ workspaceId, runId, focus: { kind: 'bug', bugId } });
    },
  };
};
