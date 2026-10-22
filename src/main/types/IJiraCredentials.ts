/** The Jira site and what signs QAzinho in to it, unsealed in main to call Jira; it never leaves main. */
export interface IJiraCredentials {
  site: string;
  email: string;
  token: string;
}
