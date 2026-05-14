/** GitHub issue fields aligned with Prisma `Task` GitHub columns (prefetch / spin). */
export type GithubIssueCandidate = {
  githubOwner: string;
  githubRepo: string;
  githubIssueNumber: number;
  githubNodeId: string | null;
  githubHtmlUrl: string;
  title: string;
  description: string | null;
};

export type GithubRepoRef = {
  owner: string;
  repo: string;
};
