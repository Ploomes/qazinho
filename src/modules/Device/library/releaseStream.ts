/**
 * Solta a conexão de uma imagem de transmissão quando ela sai da página: o navegador
 * segura só seis por servidor, e uma imagem removida não larga a dela sozinha.
 */
export function releaseStream(image: HTMLImageElement | null): () => void {
  return () => {
    queueMicrotask(() => {
      if (image !== null && !image.isConnected) image.removeAttribute('src');
    });
  };
}
