/**
 * Onde a página da janela do gravador vive: o servidor de dev do Vite enquanto se
 * desenvolve, o arquivo construído nos outros casos.
 */
export type RecorderPage = { url: string } | { file: string };
