
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";

function normalizePrivateKey(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

async function testFetch() {
  const appId = process.env.GITHUB_APP_ID?.trim();
  const installationIdRaw = process.env.GITHUB_APP_INSTALLATION_ID?.trim();
  const privateKeyRaw = process.env.GITHUB_APP_PRIVATE_KEY?.trim();
  const allowlistRaw = process.env.GITHUB_APP_REPO_ALLOWLIST?.trim();
  const label = process.env.GITHUB_APP_ISSUE_LABEL?.trim() || "quick-win";

  console.log("App ID:", appId);
  console.log("Installation ID:", installationIdRaw);
  console.log("Allowlist:", allowlistRaw);
  console.log("Label:", label);

  if (!appId || !installationIdRaw || !privateKeyRaw) {
    console.error("Missing env vars");
    return;
  }

  const installationId = Number(installationIdRaw);
  const privateKey = normalizePrivateKey(privateKeyRaw);

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });

  const repos = allowlistRaw.split(",").map(s => s.trim()).filter(Boolean);

  for (const fullRepo of repos) {
    const [owner, repo] = fullRepo.split("/");
    console.log(`Fetching ${owner}/${repo} with label ${label}...`);
    try {
      const { data } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: "open",
        labels: label,
      });
      console.log(`Found ${data.length} issues/PRs`);
      for (const item of data) {
        if (!item.pull_request) {
          console.log(` - #${item.number}: ${item.title}`);
        }
      }
    } catch (e) {
      console.error(`Failed to fetch ${fullRepo}:`, e);
    }
  }
}

testFetch();
