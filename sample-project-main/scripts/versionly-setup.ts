/**
 * Register Stripe / OpenAI / Twilio vendors + this GitHub repo with Versionly.
 *
 * Prerequisites:
 *   1. Push this project to GitHub
 *   2. Install Versionly GitHub App on that repo
 *   3. Create SMA_API_KEY in Versionly dashboard (active plan)
 *   4. Fill .env from .env.example
 *
 *   npm run versionly:setup
 */
import "dotenv/config";
import { SmaClient, SmaError } from "@wowsql/sma";
import { config } from "../src/config.js";

const VENDORS = [
  {
    vendorKey: "stripe",
    name: "Stripe",
    specUrl: "https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json",
    importHints: ["stripe", "from 'stripe'", 'from "stripe"'],
  },
  {
    vendorKey: "openai",
    name: "OpenAI",
    // Public OpenAPI mirror commonly used for tooling
    specUrl: "https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml",
    importHints: ["openai", "from 'openai'", 'from "openai"'],
  },
  {
    vendorKey: "twilio",
    name: "Twilio",
    specUrl: "https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json/twilio_api_v2010.json",
    importHints: ["twilio", "from 'twilio'", 'from "twilio"'],
  },
] as const;

async function main() {
  if (!config.versionly.apiKey || config.versionly.apiKey.includes("replace_me")) {
    throw new Error("Set SMA_API_KEY in .env (Dashboard → Settings → API keys)");
  }
  if (
    config.versionly.githubOwner.includes("your-github") ||
    config.versionly.githubRepo.includes("replace")
  ) {
    throw new Error(
      "Set GITHUB_OWNER / GITHUB_REPO in .env to match git remote (e.g. WoWSQL / sample-project)",
    );
  }

  const sma = new SmaClient({
    apiKey: config.versionly.apiKey,
    baseUrl: config.versionly.baseUrl,
  });

  console.log(`→ Versionly base: ${config.versionly.baseUrl}`);
  console.log(`→ Registering vendors…`);

  for (const v of VENDORS) {
    try {
      const { vendor } = await sma.addVendor({ ...v, importHints: [...v.importHints] });
      console.log(`  ✓ ${vendor.vendorKey} (${vendor.id})`);
    } catch (err) {
      if (err instanceof SmaError) {
        console.error(`  ✗ ${v.vendorKey}: ${err.message} [${err.status}]`);
      } else {
        throw err;
      }
    }
  }

  console.log(
    `→ Registering repo ${config.versionly.githubOwner}/${config.versionly.githubRepo}…`,
  );
  console.log(
    "  (GitHub App must be installed on this repo with Contents + Pull requests Read/write)",
  );
  const { repo } = await sma.registerRepo({
    owner: config.versionly.githubOwner,
    name: config.versionly.githubRepo,
    defaultBranch: config.versionly.defaultBranch,
  });
  console.log(`  ✓ repo id=${repo.id} branch=${repo.defaultBranch}`);

  console.log("\nNext:");
  console.log("  1. Confirm GitHub App is installed on this repo in Versionly dashboard");
  console.log("  2. npm run versionly:scan   # autoFix=true end-to-end test");
  console.log(`  3. REPO_ID=${repo.id} (saved mentally / use listRepos if needed)`);
}

main().catch((err) => {
  console.error(err instanceof SmaError ? `${err.message} (${err.status})` : err);
  process.exit(1);
});
