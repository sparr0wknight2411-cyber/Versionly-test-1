import "dotenv/config";

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

/**
 * App config — vendor credentials stay optional for local/dry-run.
 * Enable real Twilio/Stripe/OpenAI by setting keys (and DRY_RUN=false).
 */
export const config = {
  port: Number(process.env.PORT ?? 4090),
  nodeEnv: process.env.NODE_ENV ?? "development",

  stripe: {
    enabled: Boolean(optional("STRIPE_SECRET_KEY") && !optional("STRIPE_SECRET_KEY")!.includes("replace")),
    secretKey: optional("STRIPE_SECRET_KEY") ?? "sk_test_placeholder",
    webhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
  },

  openai: {
    enabled: Boolean(optional("OPENAI_API_KEY") && !optional("OPENAI_API_KEY")!.includes("replace")),
    apiKey: optional("OPENAI_API_KEY") ?? "sk-placeholder",
  },

  /** Twilio is optional unless you set real credentials / TWILIO_ENABLED=true */
  twilio: {
    enabled:
      optional("TWILIO_ENABLED") === "true" ||
      Boolean(
        optional("TWILIO_ACCOUNT_SID") &&
          !optional("TWILIO_ACCOUNT_SID")!.includes("replace") &&
          !optional("TWILIO_ACCOUNT_SID")!.includes("placeholder"),
      ),
    accountSid: optional("TWILIO_ACCOUNT_SID") ?? "ACplaceholder",
    authToken: optional("TWILIO_AUTH_TOKEN") ?? "placeholder",
    fromNumber: optional("TWILIO_FROM_NUMBER") ?? "+15555550100",
  },

  versionly: {
    apiKey: optional("SMA_API_KEY") ?? optional("VERSIONLY_API_KEY"),
    baseUrl: optional("SMA_BASE_URL") ?? optional("VERSIONLY_API_URL") ?? "https://api.versionly.dev",
    githubOwner: optional("GITHUB_OWNER") ?? "your-github-org-or-user",
    githubRepo: optional("GITHUB_REPO") ?? "versionly-e2e-consumer",
    defaultBranch: optional("GITHUB_DEFAULT_BRANCH") ?? "main",
  },

  /** Soft mode: don't call real vendors without real keys */
  dryRun: process.env.DRY_RUN !== "false",
};

export { required, optional };
