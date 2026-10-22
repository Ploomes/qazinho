import type { ISuiteDiffProps } from '@/modules/Automation/screens/Automation/components/SuiteDiff/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { diffLinesOf } from '@/modules/Automation/library';
import { SUITE_DIFF } from '@/modules/Automation/screens/Automation/components/SuiteDiff/constants';
import { MOTION } from '@/shared/constants';

export const useSuiteDiffViewModel = (props: ISuiteDiffProps) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(props.isOpenAtFirst);
  const { file } = props;

  return {
    style: {
      '--suite-diff-number': `${String(SUITE_DIFF.numberWidth)}px`,
    } as CSSProperties,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
    isOpen,
    onToggle: () => {
      setOpen((was) => !was);
    },
    path: file.path,
    status: t(SUITE_DIFF.statusKeys[file.status]),
    statusClassName: `suite-diff__status suite-diff__status--${file.status}`,
    added: `+${String(file.additions)}`,
    removed: `−${String(file.deletions)}`,
    lines: diffLinesOf(file.patch).map((line) => ({
      key: line.key,
      className: `suite-diff__line suite-diff__line--${line.kind}`,
      old: line.old === null ? '' : String(line.old),
      new: line.new === null ? '' : String(line.new),
      text: line.text,
    })),
  };
};
