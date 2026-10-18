/** What QAzinho saw when it opened the web app for the chat, or why it could not open it. */
export type AppLook =
  | { url: string; isOpen: true; page: string }
  | { url: string; isOpen: false; reason: string };
