import { ModalFrame } from '@/shared/components/templates';
import { NEWS_MODAL } from './constants';
import { useNewsModalViewModel } from './hooks';
import './styles.css';

/** As novidades de cada versão que este app traz, da mais nova à mais velha. */
export const NewsModal: React.FC = () => {
  const { title, closeLabel, releases, onClose } = useNewsModalViewModel();

  return (
    <ModalFrame
      title={title}
      width={NEWS_MODAL.widthPx}
      confirmLabel={closeLabel}
      canConfirm
      isConfirmQuiet
      hasCancel={false}
      onCancel={onClose}
      onConfirm={onClose}
    >
      <div className="news-modal">
        {releases.map((release) => (
          <section key={release.key} className="news-modal__release">
            <header className="news-modal__head">
              <h3 className="news-modal__version">{release.version}</h3>
              <span className="news-modal__day">{release.day}</span>
            </header>
            <ul className="news-modal__notes">
              {release.notes.map((note) => (
                <li key={note.key} className="news-modal__note">
                  {note.text}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ModalFrame>
  );
};
