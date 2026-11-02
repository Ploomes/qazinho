/**
 * Onde a página da janela da ilha vive: o servidor de dev do Vite enquanto se
 * desenvolve, o arquivo construído nos outros casos.
 */
export type IslandPage = { url: string } | { file: string };
