/** Um comentário que o QA escreveu para uma história, e se ele menciona quem a escreveu. */
export interface ITellStory {
  key: string;
  text: string;
  isMentioning?: boolean;
}
