import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { McpControl } from '@/modules/Setup/components/McpCard/components';
import { useMcpCardViewModel } from '@/modules/Setup/components/McpCard/hooks';
import { ORG_MCP_SERVER } from '@/modules/Setup/constants';
import { MOTION } from '@/shared/constants';
import './styles.css';

/** O alcance do agente de código nas orgs da conta: o servidor da plataforma nele. */
export const OrgServerRow: React.FC = () => {
  const view = useMcpCardViewModel({ server: ORG_MCP_SERVER });
  const { t } = useTranslation();

  return (
    <div className="org-server-row">
      <div className="org-server-row__head">
        <span className="org-server-row__text">
          <span className="org-server-row__name">{t('OUTSIDE.ORG_TITLE')}</span>
          <span className="org-server-row__about">{view.text}</span>
        </span>
        <McpControl server={ORG_MCP_SERVER} view={view} />
      </div>
      <AnimatePresence initial={false}>
        {view.error !== '' && (
          <motion.p
            key="error"
            className="org-server-row__error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
          >
            {view.error}
          </motion.p>
        )}
        {view.note !== null && (
          <motion.p
            key="note"
            className="org-server-row__about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.durationFast, ease: MOTION.ease }}
          >
            {view.note}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
