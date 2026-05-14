require("dotenv").config();
const { App } = require("octokit");

async function test() {
  console.log("--- GitHub App Diagnostic (CJS Version) ---");
  
  const appId = process.env.GITHUB_APP_ID?.trim();
  const installationIdRaw = process.env.GITHUB_APP_INSTALLATION_ID?.trim();
  const privateKeyRaw = process.env.GITHUB_APP_PRIVATE_KEY?.trim();
  const allowlistRaw = process.env.GITHUB_APP_REPO_ALLOWLIST?.trim();
  const label = process.env.GITHUB_APP_ISSUE_LABEL?.trim() || "quick-win";

  if (!appId || !installationIdRaw || !privateKeyRaw || !allowlistRaw) {
    console.error("\n❌ Error: Missing required environment variables.");
    return;
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n").trim();
  const installationId = Number(installationIdRaw);

  try {
    const app = new App({
      appId,
      privateKey,
    });

    console.log("✅ App initialized.");

    const octokit = await app.getInstallationOctokit(installationId);
    console.log(`✅ Authenticated as Installation ID: ${installationId}`);

    const repos = allowlistRaw.split(",").map(r => r.trim());

    for (const r of repos) {
      console.log(`\nChecking repo: ${r}...`);
      const [owner, repo] = r.split("/");
      
      try {
        const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
        console.log(`  ✅ Connected to repo: ${repoData.full_name}`);

        const { data: issues } = await octokit.rest.issues.listForRepo({
          owner,
          repo,
          state: "open",
          labels: label,
        });

        console.log(`  ✅ Found ${issues.length} issues with label "${label}".`);
        
        if (issues.length === 0) {
          const { data: labels } = await octokit.rest.issues.listLabelsForRepo({ owner, repo });
          console.log(`  Available labels: ${labels.map(l => l.name).join(", ")}`);
        } else {
          issues.forEach(i => console.log(`     - [#${i.number}] ${i.title}`));
        }
      } catch (e) {
        console.error(`  ❌ Failed: ${e.message}`);
      }
    }
  } catch (e) {
    console.error(`\n❌ Fatal Error: ${e.message}`);
  }
}

test();
