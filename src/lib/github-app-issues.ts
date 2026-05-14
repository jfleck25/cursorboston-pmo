import "server-only";

import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";
import type { GithubIssueCandidate, GithubRepoRef } from "@/lib/github-app-types";

const DEFAULT_QUICK_WIN_LABEL = "quick-win";
const PER_REPO_CAP = 30;
const TOTAL_CAP = 100;

function normalizePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

export function parseGithubRepoAllowlist(raw: string | undefined): GithubRepoRef[] {
  if (!raw?.trim()) return [];
  const refs: GithubRepoRef[] = [];
  for (const part of raw.split(",")) {
    const token = part.trim();
    if (!token) continue;
    const slash = token.indexOf("/");
    if (slash <= 0 || slash === token.length - 1) continue;
    const owner = token.slice(0, slash).trim();
    const repo = token.slice(slash + 1).trim();
    if (!owner || !repo || owner.includes("/") || repo.includes("/")) continue;
    refs.push({ owner, repo });
  }
  return refs;
}

function isGithubAppEnvReady(): boolean {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID?.trim();
  const privateKeyRaw = process.env.GITHUB_APP_PRIVATE_KEY?.trim();
  const allowlist = parseGithubRepoAllowlist(process.env.GITHUB_APP_REPO_ALLOWLIST);
  
  if (!appId || !installationId || !privateKeyRaw || allowlist.length === 0) {
    return false;
  }

  const privateKey = normalizePrivateKey(privateKeyRaw);
  if (!privateKey.includes("BEGIN")) {
    console.warn("[github-app] GITHUB_APP_PRIVATE_KEY is invalid. It must be a full RSA PEM key starting with '-----BEGIN RSA PRIVATE KEY-----'. Currently it looks like a SHA256 string.");
    return false;
  }

  return true;
}

function createInstallationOctokit(): Octokit | null {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const installationIdRaw = process.env.GITHUB_APP_INSTALLATION_ID?.trim();
  const privateKeyRaw = process.env.GITHUB_APP_PRIVATE_KEY?.trim();
  if (!appId || !installationIdRaw || !privateKeyRaw) return null;

  const installationId = Number(installationIdRaw);
  if (!Number.isFinite(installationId) || installationId <= 0) return null;

  const privateKey = normalizePrivateKey(privateKeyRaw);
  if (!privateKey.includes("BEGIN")) return null;

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });
}

function issueLabel(): string {
  return process.env.GITHUB_APP_ISSUE_LABEL?.trim() || DEFAULT_QUICK_WIN_LABEL;
}

/**
 * Lists open issues with the configured label from env-allowlisted repos only.
 * Uses a GitHub App installation token (server-only). Skips pull requests.
 */
export async function fetchQuickWinGithubIssues(): Promise<{
  configured: boolean;
  issues: GithubIssueCandidate[];
  partialErrors: string[];
}> {
  if (!isGithubAppEnvReady()) {
    return { configured: false, issues: [], partialErrors: [] };
  }

  const octokit = createInstallationOctokit();
  const allowlist = parseGithubRepoAllowlist(process.env.GITHUB_APP_REPO_ALLOWLIST);
  if (!octokit || allowlist.length === 0) {
    return { configured: false, issues: [], partialErrors: [] };
  }

  const label = issueLabel();
  const partialErrors: string[] = [];

  const settled = await Promise.allSettled(
    allowlist.map(async ({ owner, repo }) => {
      const { data } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: "open",
        labels: label,
        per_page: PER_REPO_CAP,
        sort: "updated",
        direction: "desc",
      });

      const repoIssues: GithubIssueCandidate[] = [];
      for (const row of data) {
        if ("pull_request" in row && row.pull_request) continue;
        repoIssues.push({
          githubOwner: owner,
          githubRepo: repo,
          githubIssueNumber: row.number,
          githubNodeId: row.node_id ?? null,
          githubHtmlUrl: row.html_url,
          title: row.title ?? "(untitled)",
          description: row.body ?? null,
        });
      }
      return repoIssues;
    }),
  );

  const collected: GithubIssueCandidate[] = [];
  for (let i = 0; i < settled.length; i++) {
    const r = settled[i];
    const ref = allowlist[i];
    if (r.status === "fulfilled") {
      for (const issue of r.value) {
        collected.push(issue);
        if (collected.length >= TOTAL_CAP) break;
      }
    } else {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      partialErrors.push(`${ref.owner}/${ref.repo}: ${msg}`);
      console.warn("[github-app] repo fetch failed", { owner: ref.owner, repo: ref.repo });
    }
    if (collected.length >= TOTAL_CAP) break;
  }

  return { configured: true, issues: collected.slice(0, TOTAL_CAP), partialErrors };
}
