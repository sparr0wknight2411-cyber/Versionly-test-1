/**
 * Intentionally outdated vendor call sites for Versionly E2E.
 *
 * This is the ONLY place Testproject keeps wrong/legacy APIs on purpose.
 * Modern clients (stripe.ts / openai.ts / twilio.ts) stay correct.
 *
 *   npm run versionly:scan
 *
 * Expected:
 *   - Stripe Charges + source  → detect + MANUAL REVIEW advisory (not fake autofix)
 *   - OpenAI Chat Completions  → migrated from legacy Completions endpoint
 *   - Twilio sendMessage/http  → detect + safe autofix toward messages.create + https
 */
import Stripe from "stripe";
import OpenAI from "openai";
import twilio from "twilio";
import { config } from "../config.js";

/** Legacy Stripe Charges API — charges a token/source immediately. */
export async function legacyStripeCharge(amountCents: number, sourceToken: string) {
  const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: "2025-02-24.acacia",
  });

  // @ts-expect-error intentional legacy Charges API for Versionly E2E
  return stripe.charges.create({
    amount: amountCents,
    currency: "usd",
    source: sourceToken,
    description: "versionly-e2e-legacy-charge",
  });
}

/** Migrated OpenAI Chat Completions (from legacy Completions). */
export async function legacyOpenAiCompletion(prompt: string) {
  const openai = new OpenAI({ apiKey: config.openai.apiKey });

  return openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 64,
  });
}

/** Legacy Twilio RestClient.sendMessage + insecure http statusCallback. */
export async function legacyTwilioSms(to: string, body: string) {
  const client = twilio(config.twilio.accountSid, config.twilio.authToken);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const legacy = client as any;

  return legacy.sendMessage({
    to,
    from: config.twilio.fromNumber,
    body,
    statusCallback: "http://example.com/twilio/status",
  });
}
