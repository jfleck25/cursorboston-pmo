import "dotenv/config";
import { App } from "octokit";

async function test() {
  console.log("--- GitHub App Diagnostic (v2) ---");
  
  const appId = process.env.GITHUB_APP_ID?.trim();
  const installationIdRaw = process.env.GITHUB_APP_INSTALLATION_ID?.trim();
  const privateKeyRaw = process.env.GITHUB_APP_PRIVATE_KEY?.trim();
  const allowlistRaw = process.env.GITHUB_APP_REPO_ALLOWLIST?.trim();
  const label = process.env.GITHUB_APP_ISSUE_LABEL?.trim() || "quick-win";

  if (!appId || !installationIdRaw || !privateKeyRaw || !allowlistRaw) {
    console.error("\n❌ Error: Missing required environment variables.");
    console.log({ appId, installationIdRaw, privateKeyPresent: !!privateKeyRaw, allowlistRaw });
    return;
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n").trim();
  const installationId = Number(installationIdRaw);

  try {
    // Initialize the App
    const app = new App({
      appId,
      privateKey,
    });

    console.log("✅ App initialized with Private Key.");

    // Get an Octokit instance for the specific installation
    const octokit = await app.getInstallationOctokit(installationId);
    console.log(`✅ Successfully authenticated as Installation ID: ${installationId}`);

    const repos = allowlistRaw.split(",").map(r => r.trim());

    for (const r of repos) {
      console.log(`\nChecking repo: ${r}...`);
      const [owner, repo] = r.split("/");
      
      if (!owner || !repo) {
        console.error(`  ❌ Invalid repo format: ${r}`);
        continue;
      }

      try {
        // 1. Check if we can even see the repo
        const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
        console.log(`  ✅ Successfully connected to repo. (Private: ${repoData.private})`);

        // 2. Fetch issues with the label
        const { data: issues } = await octokit.rest.issues.listForRepo({
          owner,
          repo,
          state: "open",
          labels: label,
        });

        console.log(`  ✅ Found ${issues.length} open issues with label "${label}".`);
        
        if (issues.length === 0) {
          console.log("  ⚠️  Hint: Check if the issues are 'Open' and if the label matches exactly (case-sensitive).");
          
          // 3. List ALL labels in the repo to see if there's a typo
          const { data: labels } = await octokit.rest.issues.listLabelsForRepo({ owner, repo });
          const labelNames = labels.map(l => l.name);
          console.log(`  Available labels in this repo: ${labelNames.join(", ") || "(none)"}`);
          
          if (!labelNames.includes(label)) {
            console.log(`  ❌ The label "${label}" does NOT exist in this repository.`);
          }
        } else {
          issues.forEach(i => console.log(`     - [#${i.number}] ${i.title}`));
        }

      } catch (e: any) {
        console.error(`  ❌ Failed: ${e.message}`);
        if (e.status === 404) {
          console.error("     Hint: The App might not be installed on this repo, or the repo name is wrong.");
        } else if (e.status === 401 || e.status === 403) {
          console.error("     Hint: Check your App ID, Installation ID, and Private Key permissions.");
        }
      }
    }
  } catch (e: any) {
    console.error(`\n❌ Fatal Error: ${e.message}`);
    console.error(e.stack);
  }
}

test().catch(console.error);
