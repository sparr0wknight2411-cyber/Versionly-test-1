/**
 * Trigger a Versionly scan (+ auto-fix PRs) against this connected repo.
 *
 *   npm run versionly:scan
 *   REPO_ID=... npm run versionly:scan
 *   AUTO_FIX=false npm run versionly:scan
 */
import "dotenv/config";
import { SmaClient, SmaError } from "@wowsql/sma";
import { config } from "../src/config.js";

async function main() {
  if (!config.versionly.apiKey || config.versionly.apiKey.includes("replace_me")) {
    throw new Error("Set SMA_API_KEY in .env");
  }

  const sma = new SmaClient({
    apiKey: config.versionly.apiKey,
    baseUrl: config.versionly.baseUrl,
  });

  let repoId = process.env.REPO_ID;
  if (!repoId) {
    const { repos } = await sma.listRepos();
    const match = repos.find(
      (r) =>
        r.owner === config.versionly.githubOwner && r.name === config.versionly.githubRepo,
    );
    if (!match) {
      throw new Error(
        `Repo ${config.versionly.githubOwner}/${config.versionly.githubRepo} not registered. Run npm run versionly:setup first.`,
      );
    }
    repoId = match.id;
  }

  const autoFix = process.env.AUTO_FIX !== "false";
  console.log(`→ scan repoId=${repoId} autoFix=${autoFix}`);

  const result = await sma.scan({ repoId, autoFix });

  console.log(`\nScan: ${result.scanId} status=${result.status}`);
  console.log(`Findings: ${result.findings?.length ?? 0}`);
  for (const f of result.findings ?? []) {
    console.log(`  - [${f.severity}] ${f.vendorKey}: ${f.summary} (${f.location})`);
  }

  const prs = result.pullRequests ?? [];
  console.log(`Pull requests: ${prs.length}`);
  for (const pr of prs) {
    console.log(`  → #${pr.number} ${pr.url} (${pr.branch})`);
  }

  if (!prs.length && autoFix) {
    console.log("\nNo PRs opened. That can mean: no breaking diffs, GitHub App missing write access, or LLM/fix path skipped.");
  }
}

main().catch((err) => {
  console.error(err instanceof SmaError ? `${err.message} (${err.status})` : err);
  process.exit(1);
});
