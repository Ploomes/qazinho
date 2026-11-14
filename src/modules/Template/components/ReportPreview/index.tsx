import type { IReportPreviewProps } from './types';
import { useReportPreviewViewModel } from './hooks';
import './styles.css';

/** A prévia do que um modelo monta: títulos, textos, listas, passos, fatos e tabelas. */
export const ReportPreview: React.FC<IReportPreviewProps> = (props) => {
  const { label, blocks } = useReportPreviewViewModel(props);

  return (
    <div className="report-preview" aria-label={label}>
      {blocks.map(({ key, block }) => {
        switch (block.kind) {
          case 'heading':
            return (
              <h3 key={key} className="report-preview__heading">
                {block.text}
              </h3>
            );
          case 'paragraph':
            return (
              <p key={key} className="report-preview__text">
                {block.text}
              </p>
            );
          case 'code':
            return (
              <pre key={key} className="report-preview__code">
                {block.text}
              </pre>
            );
          case 'list':
            return (
              <ul key={key} className="report-preview__list">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case 'steps':
            return (
              <ol key={key} className="report-preview__list">
                {block.items.map((item) => (
                  <li key={item.text}>{item.text}</li>
                ))}
              </ol>
            );
          case 'facts':
            return (
              <ul key={key} className="report-preview__list">
                {block.items.map((item) => (
                  <li key={item.label}>
                    <strong>{item.label}:</strong> {item.value}
                  </li>
                ))}
              </ul>
            );
          case 'requests':
            return (
              <ul key={key} className="report-preview__list">
                {block.items.map((item) => (
                  <li key={item.call}>
                    <code>{item.call}</code> {item.outcome}
                  </li>
                ))}
              </ul>
            );
          case 'table':
            return (
              <table key={key} className="report-preview__table">
                <thead>
                  <tr>
                    {block.head.map((cell) => (
                      <th key={cell}>{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row) => (
                    <tr key={row.join('|')}>
                      {row.map((cell, at) => (
                        <td key={`${cell}-${String(at)}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
        }
      })}
    </div>
  );
};
