import './styles.css';

/**
 * O logotipo do QAzinho, com o pingo do i feito dos dois olhos: apagados no claro, acesos
 * no escuro, dimensionado pelo tamanho de fonte em volta.
 */
export const Wordmark: React.FC = () => (
  <span className="wordmark" role="img" aria-label="QAzinho">
    <span aria-hidden="true">
      QAz
      <span className="wordmark__i">
        ı
        <span className="wordmark__dots">
          <span className="wordmark__dot" />
          <span className="wordmark__dot" />
        </span>
      </span>
      nho
    </span>
  </span>
);
